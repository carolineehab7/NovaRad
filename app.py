from flask import Flask, session, request, jsonify, send_from_directory
import psycopg2
import psycopg2.extras
import re
import os
import uuid
from datetime import datetime, timedelta
from functools import wraps
import anthropic

PGHOST = 'ep-plain-cloud-ap59nxzp-pooler.c-7.us-east-1.aws.neon.tech'
PGDATABASE = 'neondb'
PGUSER = 'neondb_owner'
PGPASSWORD = 'npg_86RoUyOKwgkF'

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_IMAGE_EXTS = {'dcm', 'jpg', 'jpeg', 'png'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve React build
REACT_BUILD = os.path.join(os.path.dirname(__file__), 'frontend', 'build')
app = Flask(__name__, static_folder=REACT_BUILD, static_url_path='/')
app.secret_key = 'novarad_secret_2026'

def get_db():
    conn = psycopg2.connect(dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD, host=PGHOST, port=5432)
    conn.autocommit = False
    return conn

def ensure_imaging_file_table():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS imaging_file (
            file_id SERIAL PRIMARY KEY,
            order_id INT REFERENCES imaging_order(order_id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_type VARCHAR(10),
            uploaded_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    conn.commit(); cursor.close(); conn.close()

try:
    ensure_imaging_file_table()
except Exception as _e:
    print(f'imaging_file table note: {_e}')

def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return func(*args, **kwargs)
    return wrapper

def role_required(*roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Unauthorized'}), 401
            if session.get('role') not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator

def row_to_dict(row):
    if row is None: return None
    if hasattr(row, '_asdict'): return row._asdict()
    if hasattr(row, 'keys'):
        data = {}
        for keys in row.keys():
            v = row[keys]
            if hasattr(v, 'isoformat'): v = v.isoformat()
            data[keys] = v
        return data
    return dict(row)

def rows_to_list(rows):
    return [row_to_dict(r) for r in rows]

# ─── Serve React ─────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    if os.path.exists(os.path.join(REACT_BUILD, path)):
        return send_from_directory(REACT_BUILD, path)
    index = os.path.join(REACT_BUILD, 'index.html')
    if os.path.exists(index):
        return send_from_directory(REACT_BUILD, 'index.html')
    return jsonify({'error': 'React build not found. Run: npm run build in the frontend/ folder.'}), 404

# ─── Auth API ────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    request_data = request.get_json()
    email = request_data.get('email', '').strip()
    password = request_data.get('password', '').strip()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM "user" WHERE email=%s AND password=%s', (email, password))
    user = cursor.fetchone()
    if not user:
        cursor.close(); conn.close()
        return jsonify({'error': 'Invalid email or password'}), 401
    session['user_id'] = user['user_id']
    session['username'] = user['username']
    session['role'] = user['role']
    session['email'] = user['email']
    role = user['role']
    if role == 'patient':
        cursor.execute('SELECT patient_id FROM patient WHERE user_id=%s', (user['user_id'],))
        patient = cursor.fetchone()
        if patient: session['patient_id'] = patient['patient_id']
    else:
        cursor.execute('SELECT staff_id FROM staff WHERE user_id=%s', (user['user_id'],))
        staff = cursor.fetchone()
        if staff: session['staff_id'] = staff['staff_id']
    cursor.close(); conn.close()
    return jsonify({'user_id': session['user_id'], 'username': session['username'], 'role': role, 'email': session['email']})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/auth/me')
def api_me():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({'user_id': session['user_id'], 'username': session['username'], 'role': session['role'], 'email': session['email']})

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    request_data = request.get_json()
    SSN = request_data.get('SSN', '')
    first_name = request_data.get('fname', '')
    middle_name = request_data.get('mname', '')
    last_name = request_data.get('lname', '')
    gender = request_data.get('gender', 'M')
    dob = request_data.get('DOB', '') or None
    phone = request_data.get('phone', '')
    address = request_data.get('add', '')
    blood_type = request_data.get('bt', '')
    medical_history = request_data.get('mh', '')
    email = request_data.get('email', '')
    password = request_data.get('password', '')
    full_name = f"{first_name} {middle_name} {last_name}".strip()
    username = email.split('@')[0]
    if not SSN.isdigit() or len(SSN) != 14:
        return jsonify({'error': 'SSN must be 14 digits'}), 400
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({'error': 'Phone must be 11 digits'}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'Invalid email'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT user_id FROM "user" WHERE email=%s', (email,))
    if cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({'error': 'Email already registered'}), 400
    try:
        cursor.execute('INSERT INTO "user" (username, password, email, role) VALUES (%s,%s,%s,%s) RETURNING user_id', (username, password, email, 'patient'))
        user_id = cursor.fetchone()[0]
        cursor.execute('INSERT INTO patient (user_id, p_full_name, dob, gender, phone, address, blood_type, medical_history, ssn) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                    (user_id, full_name, dob, gender, phone, address, blood_type, medical_history, SSN))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback()
        cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# ─── Patient API ────────────────────────────────────────────────

@app.route('/api/patient/dashboard')
@role_required('patient')
def api_patient_dashboard():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM patient WHERE patient_id=%s', (patient_id,))
    patient = row_to_dict(cursor.fetchone())
    cursor.execute('''SELECT appointment.*, staff.s_full_name as staff_name FROM appointment LEFT JOIN staff ON appointment.staff_id=staff.staff_id
        WHERE appointment.patient_id=%s ORDER BY appointment.scheduled_datetime DESC LIMIT 5''', (patient_id,))
    appointments = rows_to_list(cursor.fetchall())
    cursor.execute('SELECT * FROM invoice WHERE patient_id=%s ORDER BY due_date DESC LIMIT 5', (patient_id,))
    invoices = rows_to_list(cursor.fetchall())
    cursor.execute('''SELECT medical_record.*, radiology_report.findings_and_impression, radiology_report.report_date, radiology_report.signed FROM medical_record
        LEFT JOIN radiology_report ON medical_record.report_id=radiology_report.report_id WHERE medical_record.patient_id=%s ORDER BY medical_record.date_created DESC LIMIT 5''', (patient_id,))
    records = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'patient': patient, 'appointments': appointments, 'invoices': invoices, 'records': records})

@app.route('/api/patient/profile', methods=['GET', 'PUT'])
@role_required('patient')
def api_patient_profile():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'PUT':
        request_data = request.get_json()
        cursor.execute('UPDATE patient SET phone=%s, address=%s, blood_type=%s, medical_history=%s WHERE patient_id=%s',
                    (request_data.get('phone'), request_data.get('address'), request_data.get('blood_type'), request_data.get('medical_history'), patient_id))
        conn.commit()
    cursor.execute('SELECT * FROM patient WHERE patient_id=%s', (patient_id,))
    patient = row_to_dict(cursor.fetchone())
    cursor.close(); conn.close()
    return jsonify(patient)

@app.route('/api/patient/appointments')
@role_required('patient')
def api_patient_appointments():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT appointment.*, staff.s_full_name as staff_name FROM appointment LEFT JOIN staff ON appointment.staff_id=staff.staff_id
        WHERE appointment.patient_id=%s ORDER BY appointment.scheduled_datetime DESC''', (patient_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/patient/book-appointment', methods=['POST'])
@role_required('patient')
def api_book_appointment():
    patient_id = session['patient_id']
    request_data = request.get_json()
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute("SELECT staff_id FROM staff WHERE role IN ('receptionist','technician') LIMIT 1")
    staff_result = cursor.fetchone()
    staff_id = staff_result['staff_id'] if staff_result else None
    scheduled_str = request_data.get('scheduled_datetime')
    try:
        scheduled_dt = datetime.fromisoformat(scheduled_str)
    except (TypeError, ValueError):
        cursor.close(); conn.close()
        return jsonify({'error': 'Invalid date format.'}), 400
    if scheduled_dt <= datetime.now():
        cursor.close(); conn.close()
        return jsonify({'error': 'Appointment date must be in the future.'}), 400
    price_map = {'MRI': 1500, 'CT': 1200, 'X-Ray': 300, 'Ultrasound': 500}
    amount = price_map.get(request_data.get('modality'), 800)
    due_date = (datetime.now() + timedelta(days=30)).date()
    try:
        cursor.execute('INSERT INTO appointment (patient_id, staff_id, scheduled_datetime, modality, status) VALUES (%s,%s,%s,%s,%s) RETURNING appointment_id',
                    (patient_id, staff_id, scheduled_dt, request_data.get('modality'), 'scheduled'))
        appointment_id = cursor.fetchone()[0]
        cursor.execute('INSERT INTO imaging_order (appointment_id, referring_doctor, body_part, modality, order_status) VALUES (%s,%s,%s,%s,%s)',
                    (appointment_id, request_data.get('referring_doctor'), request_data.get('body_part'), request_data.get('modality'), 'pending'))
        cursor.execute('INSERT INTO invoice (patient_id, appointment_id, total_amount, status, due_date) VALUES (%s,%s,%s,%s,%s)',
                    (patient_id, appointment_id, amount, 'unpaid', due_date))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/patient/cancel-appointment/<int:appointment_id>', methods=['POST'])
@role_required('patient')
def api_cancel_appointment(appointment_id):
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s AND patient_id=%s', ('cancelled', appointment_id, patient_id))
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/patient/billing')
@role_required('patient')
def api_patient_billing():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT invoice.*, appointment.modality, appointment.scheduled_datetime FROM invoice
        LEFT JOIN appointment ON invoice.appointment_id=appointment.appointment_id WHERE invoice.patient_id=%s ORDER BY invoice.due_date DESC''', (patient_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/patient/pay-invoice/<int:invoice_id>', methods=['POST'])
@role_required('patient')
def api_pay_invoice(invoice_id):
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('UPDATE invoice SET status=%s WHERE invoice_id=%s AND patient_id=%s', ('paid', invoice_id, patient_id))
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/patient/records')
@role_required('patient')
def api_patient_records():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT medical_record.*, radiology_report.findings_and_impression, radiology_report.report_date, radiology_report.signed, staff.s_full_name as staff_name
        FROM medical_record LEFT JOIN radiology_report ON medical_record.report_id=radiology_report.report_id
        LEFT JOIN staff ON medical_record.staff_id=staff.staff_id WHERE medical_record.patient_id=%s ORDER BY medical_record.date_created DESC''', (patient_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

# ─── Staff API ──────────────────────────────────────────────────

@app.route('/api/staff/dashboard')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_dashboard():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT appointment.*, patient.p_full_name as patient_name FROM appointment JOIN patient ON appointment.patient_id=patient.patient_id
        WHERE appointment.status='scheduled' ORDER BY appointment.scheduled_datetime ASC LIMIT 10''')
    appointments = rows_to_list(cursor.fetchall())
    cursor.execute('''SELECT imaging_order.*, appointment.scheduled_datetime, appointment.modality, patient.p_full_name as patient_name
        FROM imaging_order JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
        JOIN patient ON appointment.patient_id=patient.patient_id WHERE imaging_order.order_status != 'completed' ORDER BY appointment.scheduled_datetime ASC LIMIT 10''')
    orders = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'appointments': appointments, 'orders': orders})

@app.route('/api/staff/appointments')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_appointments():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT appointment.*, patient.p_full_name as patient_name, patient.phone as patient_phone FROM appointment
        JOIN patient ON appointment.patient_id=patient.patient_id ORDER BY appointment.scheduled_datetime DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/update-appointment/<int:appointment_id>', methods=['POST'])
@role_required('radiologist', 'technician', 'receptionist')
def api_update_appointment(appointment_id):
    request_data = request.get_json()
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s', (request_data.get('status'), appointment_id))
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/staff/imaging-orders')
@role_required('radiologist', 'technician', 'receptionist')
def api_imaging_orders():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT imaging_order.*, appointment.scheduled_datetime, appointment.modality, patient.p_full_name as patient_name, radiology_report.report_id, radiology_report.signed
        FROM imaging_order JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
        JOIN patient ON appointment.patient_id=patient.patient_id LEFT JOIN radiology_report ON radiology_report.order_id=imaging_order.order_id
        ORDER BY appointment.scheduled_datetime DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/update-order/<int:order_id>', methods=['POST'])
@role_required('radiologist', 'technician', 'receptionist')
def api_update_order(order_id):
    request_data = request.get_json()
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('UPDATE imaging_order SET order_status=%s WHERE order_id=%s', (request_data.get('order_status'), order_id))
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/staff/radiology-report/<int:order_id>', methods=['GET', 'POST'])
@role_required('radiologist')
def api_radiology_report(order_id):
    staff_id = session['staff_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'GET':
        cursor.execute('''SELECT imaging_order.*, appointment.modality, appointment.scheduled_datetime, patient.p_full_name as patient_name, patient.patient_id
            FROM imaging_order JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
            JOIN patient ON appointment.patient_id=patient.patient_id WHERE imaging_order.order_id=%s''', (order_id,))
        order = row_to_dict(cursor.fetchone())
        cursor.execute('SELECT * FROM radiology_report WHERE order_id=%s', (order_id,))
        report = row_to_dict(cursor.fetchone())
        cursor.close(); conn.close()
        return jsonify({'order': order, 'report': report})
    request_data = request.get_json()
    findings = request_data.get('findings', '')
    signed = request_data.get('signed', False)
    try:
        cursor.execute('SELECT * FROM radiology_report WHERE order_id=%s', (order_id,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute('UPDATE radiology_report SET findings_and_impression=%s, signed=%s, radiologist_id=%s WHERE order_id=%s',
                        (findings, signed, staff_id, order_id))
        else:
            cursor.execute('INSERT INTO radiology_report (order_id, radiologist_id, findings_and_impression, signed) VALUES (%s,%s,%s,%s) RETURNING report_id',
                        (order_id, staff_id, findings, signed))
            report_id = cursor.fetchone()[0]
            cursor.execute('UPDATE imaging_order SET order_status=%s WHERE order_id=%s', ('completed', order_id))
            cursor.execute('SELECT patient_id FROM appointment JOIN imaging_order ON imaging_order.appointment_id=appointment.appointment_id WHERE imaging_order.order_id=%s', (order_id,))
            result = cursor.fetchone()
            cursor.execute('SELECT modality FROM imaging_order WHERE order_id=%s', (order_id,))
            modality_result = cursor.fetchone()
            if result:
                cursor.execute('INSERT INTO medical_record (patient_id, staff_id, record_type, description, report_id) VALUES (%s,%s,%s,%s,%s)',
                            (result['patient_id'], staff_id, modality_result['modality'] if modality_result else 'Imaging', findings[:200], report_id))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# ─── Admin API ──────────────────────────────────────────────────

@app.route('/api/admin/dashboard')
@role_required('admin')
def api_admin_dashboard():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT COUNT(*) as cnt FROM patient'); total_patients = cursor.fetchone()['cnt']
    cursor.execute('SELECT COUNT(*) as cnt FROM staff'); total_staff = cursor.fetchone()['cnt']
    cursor.execute("SELECT COUNT(*) as cnt FROM appointment WHERE status='scheduled'"); pending_appts = cursor.fetchone()['cnt']
    cursor.execute("SELECT COUNT(*) as cnt FROM invoice WHERE status='unpaid'"); unpaid_invoices = cursor.fetchone()['cnt']
    cursor.execute("SELECT COALESCE(SUM(total_amount),0) as total FROM invoice WHERE status='paid'"); total_revenue = cursor.fetchone()['total']
    cursor.execute('''SELECT appointment.*, patient.p_full_name as patient_name, staff.s_full_name as staff_name FROM appointment
        JOIN patient ON appointment.patient_id=patient.patient_id LEFT JOIN staff ON appointment.staff_id=staff.staff_id
        ORDER BY appointment.scheduled_datetime DESC LIMIT 10''')
    recent_appts = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'total_patients': total_patients, 'total_staff': total_staff, 'pending_appts': pending_appts,
                    'unpaid_invoices': unpaid_invoices, 'total_revenue': int(total_revenue), 'recent_appts': recent_appts})

@app.route('/api/admin/staff', methods=['GET', 'POST'])
@role_required('admin')
def api_admin_staff():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'POST':
        request_data = request.get_json()
        try:
            cursor.execute('INSERT INTO "user" (username, password, email, role) VALUES (%s,%s,%s,%s) RETURNING user_id',
                        (request_data['username'], request_data['password'], request_data['email'], request_data['role']))
            user_id = cursor.fetchone()[0]
            cursor.execute('INSERT INTO staff (user_id, s_full_name, role, department) VALUES (%s,%s,%s,%s)',
                        (user_id, request_data['full_name'], request_data['role'], request_data.get('department', '')))
            conn.commit()
        except Exception as e:
            conn.rollback(); cursor.close(); conn.close()
            return jsonify({'error': str(e)}), 400
    cursor.execute('''SELECT staff.*, user.email, user.username FROM staff JOIN "user" ON staff.user_id=user.user_id ORDER BY staff.staff_id DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/admin/staff/<int:staff_id>', methods=['DELETE'])
@role_required('admin')
def api_delete_staff(staff_id):
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT user_id FROM staff WHERE staff_id=%s', (staff_id,))
    staff_result = cursor.fetchone()
    if staff_result:
        cursor.execute('DELETE FROM "user" WHERE user_id=%s', (staff_result['user_id'],))
        conn.commit()
    cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/admin/patients')
@role_required('admin')
def api_admin_patients():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT patient.*, user.email, user.username FROM patient JOIN "user" ON patient.user_id=user.user_id ORDER BY patient.patient_id DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/admin/billing')
@role_required('admin')
def api_admin_billing():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT invoice.*, patient.p_full_name, appointment.modality, appointment.scheduled_datetime FROM invoice
        JOIN patient ON invoice.patient_id=patient.patient_id JOIN appointment ON invoice.appointment_id=appointment.appointment_id ORDER BY invoice.due_date DESC''')
    invoices = rows_to_list(cursor.fetchall())
    cursor.execute("SELECT COALESCE(SUM(total_amount),0) as t FROM invoice WHERE status='paid'"); paid = cursor.fetchone()['t']
    cursor.execute("SELECT COALESCE(SUM(total_amount),0) as t FROM invoice WHERE status='unpaid'"); unpaid = cursor.fetchone()['t']
    cursor.close(); conn.close()
    return jsonify({'invoices': invoices, 'paid': int(paid), 'unpaid': int(unpaid)})

@app.route('/api/admin/reports')
@role_required('admin')
def api_admin_reports():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT radiology_report.*, staff.s_full_name as radiologist_name, imaging_order.modality, imaging_order.body_part, patient.p_full_name as patient_name
        FROM radiology_report JOIN staff ON radiology_report.radiologist_id=staff.staff_id
        JOIN imaging_order ON radiology_report.order_id=imaging_order.order_id JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
        JOIN patient ON appointment.patient_id=patient.patient_id ORDER BY radiology_report.report_date DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/upload-image/<int:order_id>', methods=['POST'])
@role_required('receptionist', 'technician', 'radiologist', 'admin')
def api_upload_image(order_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Empty filename'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
    if ext not in ALLOWED_IMAGE_EXTS:
        return jsonify({'error': 'Invalid file type. Allowed: DCM, JPG, JPEG, PNG'}), 400

    stored_ext = 'png' if ext == 'dcm' else ext
    stored_name = f"{uuid.uuid4().hex}.{stored_ext}"
    dest = os.path.join(UPLOAD_FOLDER, stored_name)

    if ext == 'dcm':
        try:
            import pydicom, numpy as np
            from PIL import Image
            import io
            ds = pydicom.dcmread(io.BytesIO(f.read()))
            arr = ds.pixel_array.astype(float)
            lo, hi = arr.min(), arr.max()
            if hi > lo:
                arr = ((arr - lo) / (hi - lo) * 255).astype(np.uint8)
            else:
                arr = arr.astype(np.uint8)
            if arr.ndim == 2:
                img = Image.fromarray(arr, mode='L').convert('RGB')
            else:
                img = Image.fromarray(arr)
            img.save(dest)
        except Exception as e:
            return jsonify({'error': f'DICOM conversion failed: {str(e)}'}), 400
    else:
        f.save(dest)

    conn = get_db(); cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO imaging_file (order_id, filename, original_name, file_type) VALUES (%s,%s,%s,%s) RETURNING file_id',
        (order_id, stored_name, f.filename, ext)
    )
    file_id = cursor.fetchone()[0]
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True, 'file_id': file_id, 'filename': stored_name})

@app.route('/api/staff/images/<int:order_id>')
@login_required
def api_get_images(order_id):
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM imaging_file WHERE order_id=%s ORDER BY uploaded_at', (order_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/uploads/<filename>')
@login_required
def serve_upload(filename):
    safe = os.path.basename(filename)
    return send_from_directory(UPLOAD_FOLDER, safe)

NOVA_SYSTEM_PROMPT = """You are Nova, the AI assistant for NovaRad Center — a radiology imaging center in Egypt.
Help patients and staff with questions about services, booking, billing, and navigating the portal.

Key facts:
- Services & prices: MRI (1,500 EGP), CT Scan (1,200 EGP), X-Ray (300 EGP), Ultrasound (500 EGP)
- Hours: Saturday–Thursday, 8 AM – 8 PM
- Phone: 01117151930
- Booking: Patient Dashboard → "Book Appointment" → choose modality, body part, date/time (must be future)
- Payment: Billing section → "Pay Now" → enter Visa card details
- Results: Medical Records tab — visible after the radiologist signs the report
- Invoice: auto-generated on booking, due in 30 days
- Cancel appointment: My Appointments page → Cancel button (only while status is "scheduled")
- Staff can upload images and write radiology reports from the Staff portal

Keep replies concise (2–4 sentences), friendly, and guide the user to the correct portal section.
Never make up information not listed above."""

@app.route('/api/chatbot', methods=['POST'])
def api_chatbot():
    body = request.get_json() or {}
    msg = body.get('message', '').strip()
    history = body.get('history', [])

    if not msg:
        return jsonify({'reply': 'Please type a message first.'})

    if not ANTHROPIC_API_KEY:
        keyword_map = {
            'appointment': 'Book via Patient Dashboard → Book Appointment.',
            'mri': 'MRI: 1,500 EGP. Book from your dashboard.',
            'ct': 'CT Scan: 1,200 EGP. Book from your dashboard.',
            'x-ray': 'X-Ray: 300 EGP — fastest service.',
            'ultrasound': 'Ultrasound: 500 EGP.',
            'billing': 'Billing section → Pay Now.',
            'results': 'Medical Records tab after radiologist signs.',
            'price': 'MRI: 1,500 | CT: 1,200 | X-Ray: 300 | Ultrasound: 500 EGP.',
            'contact': 'Call 01117151930.',
            'hours': 'Open Saturday–Thursday, 8AM–8PM.',
        }
        ml = msg.lower()
        for k, v in keyword_map.items():
            if k in ml:
                return jsonify({'reply': v})
        return jsonify({'reply': 'For assistance call 01117151930 or use the portal.'})

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        messages = [{'role': m['role'], 'content': m['content']} for m in history[-10:]]
        messages.append({'role': 'user', 'content': msg})
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=350,
            system=NOVA_SYSTEM_PROMPT,
            messages=messages,
        )
        return jsonify({'reply': response.content[0].text})
    except Exception:
        return jsonify({'reply': 'Sorry, I am unavailable right now. Call 01117151930 for help.'})

if __name__ == '__main__':
    try:
        init_db()
        print("Database initialized.")
    except Exception as e:
        print(f"DB warning: {e}")
    app.run(debug=True, port=5000)
