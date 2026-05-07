from flask import Flask, session, request, jsonify, send_from_directory
import psycopg2
import psycopg2.extras
import re
import os
from datetime import datetime, timedelta
from functools import wraps

PGHOST = 'ep-green-lake-a5nsemie.us-east-2.aws.neon.tech'
PGDATABASE = 'neondb'
PGUSER = 'neondb_owner'
PGPASSWORD = '4ZFkXlMWTJA2'

# Serve React build
REACT_BUILD = os.path.join(os.path.dirname(__file__), 'frontend', 'build')
app = Flask(__name__, static_folder=REACT_BUILD, static_url_path='/')
app.secret_key = 'novarad_secret_2026'

def get_db():
    conn = psycopg2.connect(dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD, host=PGHOST, port=5432)
    conn.autocommit = False
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "user" (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            role VARCHAR(20) NOT NULL CHECK (role IN ('patient','radiologist','technician','receptionist','admin'))
        );
        CREATE TABLE IF NOT EXISTS patient (
            patient_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            p_full_name VARCHAR(100),
            dob DATE,
            gender CHAR(1),
            phone CHAR(11),
            address VARCHAR(100),
            blood_type VARCHAR(5),
            medical_history TEXT,
            ssn VARCHAR(14) UNIQUE
        );
        CREATE TABLE IF NOT EXISTS staff (
            staff_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            s_full_name VARCHAR(100),
            role VARCHAR(20) CHECK (role IN ('radiologist','technician','receptionist','admin')),
            department VARCHAR(100)
        );
        CREATE TABLE IF NOT EXISTS appointment (
            appointment_id SERIAL PRIMARY KEY,
            patient_id INT REFERENCES patient(patient_id),
            staff_id INT REFERENCES staff(staff_id),
            scheduled_datetime TIMESTAMP,
            modality VARCHAR(30),
            status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','waiting'))
        );
        CREATE TABLE IF NOT EXISTS imaging_order (
            order_id SERIAL PRIMARY KEY,
            appointment_id INT REFERENCES appointment(appointment_id),
            referring_doctor VARCHAR(50),
            body_part VARCHAR(30),
            modality VARCHAR(30),
            order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending','in_progress','completed'))
        );
        CREATE TABLE IF NOT EXISTS radiology_report (
            report_id SERIAL PRIMARY KEY,
            order_id INT REFERENCES imaging_order(order_id),
            radiologist_id INT REFERENCES staff(staff_id),
            findings_and_impression VARCHAR(3000),
            report_date DATE DEFAULT CURRENT_DATE,
            signed BOOLEAN DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS invoice (
            invoice_id SERIAL PRIMARY KEY,
            patient_id INT REFERENCES patient(patient_id),
            appointment_id INT REFERENCES appointment(appointment_id),
            total_amount INT,
            status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
            due_date DATE
        );
        CREATE TABLE IF NOT EXISTS medical_record (
            record_id SERIAL PRIMARY KEY,
            patient_id INT REFERENCES patient(patient_id),
            staff_id INT REFERENCES staff(staff_id),
            record_type VARCHAR(100),
            description VARCHAR(3000),
            date_created DATE DEFAULT CURRENT_DATE,
            report_id INT REFERENCES radiology_report(report_id)
        );
    ''')
    conn.commit()
    cur.close(); conn.close()

def login_required(f):
    @wraps(f)
    def d(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return d

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def d(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Unauthorized'}), 401
            if session.get('role') not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return d
    return decorator

def row_to_dict(row):
    if row is None: return None
    if hasattr(row, '_asdict'): return row._asdict()
    if hasattr(row, 'keys'):
        d = {}
        for k in row.keys():
            v = row[k]
            if hasattr(v, 'isoformat'): v = v.isoformat()
            d[k] = v
        return d
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
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('SELECT * FROM "user" WHERE email=%s AND password=%s', (email, password))
    user = cur.fetchone()
    if not user:
        cur.close(); conn.close()
        return jsonify({'error': 'Invalid email or password'}), 401
    session['user_id'] = user['user_id']
    session['username'] = user['username']
    session['role'] = user['role']
    session['email'] = user['email']
    role = user['role']
    if role == 'patient':
        cur.execute('SELECT patient_id FROM patient WHERE user_id=%s', (user['user_id'],))
        p = cur.fetchone()
        if p: session['patient_id'] = p['patient_id']
    else:
        cur.execute('SELECT staff_id FROM staff WHERE user_id=%s', (user['user_id'],))
        s = cur.fetchone()
        if s: session['staff_id'] = s['staff_id']
    cur.close(); conn.close()
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
    d = request.get_json()
    SSN = d.get('SSN', '')
    first_name = d.get('fname', '')
    middle_name = d.get('mname', '')
    last_name = d.get('lname', '')
    gender = d.get('gender', 'M')
    dob = d.get('DOB', '') or None
    phone = d.get('phone', '')
    address = d.get('add', '')
    blood_type = d.get('bt', '')
    mh = d.get('mh', '')
    email = d.get('email', '')
    password = d.get('password', '')
    full_name = f"{first_name} {middle_name} {last_name}".strip()
    username = email.split('@')[0]
    if not SSN.isdigit() or len(SSN) != 14:
        return jsonify({'error': 'SSN must be 14 digits'}), 400
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({'error': 'Phone must be 11 digits'}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'Invalid email'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT user_id FROM "user" WHERE email=%s', (email,))
    if cur.fetchone():
        cur.close(); conn.close()
        return jsonify({'error': 'Email already registered'}), 400
    try:
        cur.execute('INSERT INTO "user" (username, password, email, role) VALUES (%s,%s,%s,%s) RETURNING user_id', (username, password, email, 'patient'))
        uid = cur.fetchone()[0]
        cur.execute('INSERT INTO patient (user_id, p_full_name, dob, gender, phone, address, blood_type, medical_history, ssn) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                    (uid, full_name, dob, gender, phone, address, blood_type, mh, SSN))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# ─── Patient API ────────────────────────────────────────────────

@app.route('/api/patient/dashboard')
@role_required('patient')
def api_patient_dashboard():
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('SELECT * FROM patient WHERE patient_id=%s', (pid,))
    patient = row_to_dict(cur.fetchone())
    cur.execute('''SELECT a.*, s.s_full_name as staff_name FROM appointment a LEFT JOIN staff s ON a.staff_id=s.staff_id
        WHERE a.patient_id=%s ORDER BY a.scheduled_datetime DESC LIMIT 5''', (pid,))
    appointments = rows_to_list(cur.fetchall())
    cur.execute('SELECT * FROM invoice WHERE patient_id=%s ORDER BY due_date DESC LIMIT 5', (pid,))
    invoices = rows_to_list(cur.fetchall())
    cur.execute('''SELECT mr.*, rr.findings_and_impression, rr.report_date, rr.signed FROM medical_record mr
        LEFT JOIN radiology_report rr ON mr.report_id=rr.report_id WHERE mr.patient_id=%s ORDER BY mr.date_created DESC LIMIT 5''', (pid,))
    records = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify({'patient': patient, 'appointments': appointments, 'invoices': invoices, 'records': records})

@app.route('/api/patient/profile', methods=['GET', 'PUT'])
@role_required('patient')
def api_patient_profile():
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'PUT':
        d = request.get_json()
        cur.execute('UPDATE patient SET phone=%s, address=%s, blood_type=%s, medical_history=%s WHERE patient_id=%s',
                    (d.get('phone'), d.get('address'), d.get('blood_type'), d.get('medical_history'), pid))
        conn.commit()
    cur.execute('SELECT * FROM patient WHERE patient_id=%s', (pid,))
    p = row_to_dict(cur.fetchone())
    cur.close(); conn.close()
    return jsonify(p)

@app.route('/api/patient/appointments')
@role_required('patient')
def api_patient_appointments():
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT a.*, s.s_full_name as staff_name FROM appointment a LEFT JOIN staff s ON a.staff_id=s.staff_id
        WHERE a.patient_id=%s ORDER BY a.scheduled_datetime DESC''', (pid,))
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/patient/book-appointment', methods=['POST'])
@role_required('patient')
def api_book_appointment():
    pid = session['patient_id']
    d = request.get_json()
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT staff_id FROM staff WHERE role IN ('receptionist','technician') LIMIT 1")
    s = cur.fetchone()
    staff_id = s['staff_id'] if s else None
    price_map = {'MRI': 1500, 'CT': 1200, 'X-Ray': 300, 'Ultrasound': 500}
    amount = price_map.get(d.get('modality'), 800)
    due = (datetime.now() + timedelta(days=30)).date()
    try:
        cur.execute('INSERT INTO appointment (patient_id, staff_id, scheduled_datetime, modality, status) VALUES (%s,%s,%s,%s,%s) RETURNING appointment_id',
                    (pid, staff_id, d.get('scheduled_datetime'), d.get('modality'), 'scheduled'))
        appt_id = cur.fetchone()[0]
        cur.execute('INSERT INTO imaging_order (appointment_id, referring_doctor, body_part, modality, order_status) VALUES (%s,%s,%s,%s,%s)',
                    (appt_id, d.get('referring_doctor'), d.get('body_part'), d.get('modality'), 'pending'))
        cur.execute('INSERT INTO invoice (patient_id, appointment_id, total_amount, status, due_date) VALUES (%s,%s,%s,%s,%s)',
                    (pid, appt_id, amount, 'unpaid', due))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/patient/cancel-appointment/<int:appt_id>', methods=['POST'])
@role_required('patient')
def api_cancel_appointment(appt_id):
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor()
    cur.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s AND patient_id=%s', ('cancelled', appt_id, pid))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/patient/billing')
@role_required('patient')
def api_patient_billing():
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT i.*, a.modality, a.scheduled_datetime FROM invoice i
        LEFT JOIN appointment a ON i.appointment_id=a.appointment_id WHERE i.patient_id=%s ORDER BY i.due_date DESC''', (pid,))
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/patient/pay-invoice/<int:inv_id>', methods=['POST'])
@role_required('patient')
def api_pay_invoice(inv_id):
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor()
    cur.execute('UPDATE invoice SET status=%s WHERE invoice_id=%s AND patient_id=%s', ('paid', inv_id, pid))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/patient/records')
@role_required('patient')
def api_patient_records():
    pid = session['patient_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT mr.*, rr.findings_and_impression, rr.report_date, rr.signed, s.s_full_name as staff_name
        FROM medical_record mr LEFT JOIN radiology_report rr ON mr.report_id=rr.report_id
        LEFT JOIN staff s ON mr.staff_id=s.staff_id WHERE mr.patient_id=%s ORDER BY mr.date_created DESC''', (pid,))
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

# ─── Staff API ──────────────────────────────────────────────────

@app.route('/api/staff/dashboard')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_dashboard():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT a.*, p.p_full_name as patient_name FROM appointment a JOIN patient p ON a.patient_id=p.patient_id
        WHERE a.status='scheduled' ORDER BY a.scheduled_datetime ASC LIMIT 10''')
    appointments = rows_to_list(cur.fetchall())
    cur.execute('''SELECT io.*, a.scheduled_datetime, a.modality, p.p_full_name as patient_name
        FROM imaging_order io JOIN appointment a ON io.appointment_id=a.appointment_id
        JOIN patient p ON a.patient_id=p.patient_id WHERE io.order_status != 'completed' ORDER BY a.scheduled_datetime ASC LIMIT 10''')
    orders = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify({'appointments': appointments, 'orders': orders})

@app.route('/api/staff/appointments')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_appointments():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT a.*, p.p_full_name as patient_name, p.phone as patient_phone FROM appointment a
        JOIN patient p ON a.patient_id=p.patient_id ORDER BY a.scheduled_datetime DESC''')
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/update-appointment/<int:appt_id>', methods=['POST'])
@role_required('radiologist', 'technician', 'receptionist')
def api_update_appointment(appt_id):
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    cur.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s', (d.get('status'), appt_id))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/staff/imaging-orders')
@role_required('radiologist', 'technician', 'receptionist')
def api_imaging_orders():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT io.*, a.scheduled_datetime, a.modality, p.p_full_name as patient_name, rr.report_id, rr.signed
        FROM imaging_order io JOIN appointment a ON io.appointment_id=a.appointment_id
        JOIN patient p ON a.patient_id=p.patient_id LEFT JOIN radiology_report rr ON rr.order_id=io.order_id
        ORDER BY a.scheduled_datetime DESC''')
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/update-order/<int:order_id>', methods=['POST'])
@role_required('radiologist', 'technician', 'receptionist')
def api_update_order(order_id):
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    cur.execute('UPDATE imaging_order SET order_status=%s WHERE order_id=%s', (d.get('order_status'), order_id))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/staff/radiology-report/<int:order_id>', methods=['GET', 'POST'])
@role_required('radiologist')
def api_radiology_report(order_id):
    sid = session['staff_id']
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'GET':
        cur.execute('''SELECT io.*, a.modality, a.scheduled_datetime, p.p_full_name as patient_name, p.patient_id
            FROM imaging_order io JOIN appointment a ON io.appointment_id=a.appointment_id
            JOIN patient p ON a.patient_id=p.patient_id WHERE io.order_id=%s''', (order_id,))
        order = row_to_dict(cur.fetchone())
        cur.execute('SELECT * FROM radiology_report WHERE order_id=%s', (order_id,))
        report = row_to_dict(cur.fetchone())
        cur.close(); conn.close()
        return jsonify({'order': order, 'report': report})
    d = request.get_json()
    findings = d.get('findings', '')
    signed = d.get('signed', False)
    try:
        cur.execute('SELECT * FROM radiology_report WHERE order_id=%s', (order_id,))
        existing = cur.fetchone()
        if existing:
            cur.execute('UPDATE radiology_report SET findings_and_impression=%s, signed=%s, radiologist_id=%s WHERE order_id=%s',
                        (findings, signed, sid, order_id))
        else:
            cur.execute('INSERT INTO radiology_report (order_id, radiologist_id, findings_and_impression, signed) VALUES (%s,%s,%s,%s) RETURNING report_id',
                        (order_id, sid, findings, signed))
            report_id = cur.fetchone()[0]
            cur.execute('UPDATE imaging_order SET order_status=%s WHERE order_id=%s', ('completed', order_id))
            cur.execute('SELECT patient_id FROM appointment a JOIN imaging_order io ON io.appointment_id=a.appointment_id WHERE io.order_id=%s', (order_id,))
            res = cur.fetchone()
            cur.execute('SELECT modality FROM imaging_order WHERE order_id=%s', (order_id,))
            mod = cur.fetchone()
            if res:
                cur.execute('INSERT INTO medical_record (patient_id, staff_id, record_type, description, report_id) VALUES (%s,%s,%s,%s,%s)',
                            (res['patient_id'], sid, mod['modality'] if mod else 'Imaging', findings[:200], report_id))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# ─── Admin API ──────────────────────────────────────────────────

@app.route('/api/admin/dashboard')
@role_required('admin')
def api_admin_dashboard():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('SELECT COUNT(*) as cnt FROM patient'); total_patients = cur.fetchone()['cnt']
    cur.execute('SELECT COUNT(*) as cnt FROM staff'); total_staff = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM appointment WHERE status='scheduled'"); pending_appts = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM invoice WHERE status='unpaid'"); unpaid_invoices = cur.fetchone()['cnt']
    cur.execute("SELECT COALESCE(SUM(total_amount),0) as total FROM invoice WHERE status='paid'"); total_revenue = cur.fetchone()['total']
    cur.execute('''SELECT a.*, p.p_full_name as patient_name, s.s_full_name as staff_name FROM appointment a
        JOIN patient p ON a.patient_id=p.patient_id LEFT JOIN staff s ON a.staff_id=s.staff_id
        ORDER BY a.scheduled_datetime DESC LIMIT 10''')
    recent_appts = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify({'total_patients': total_patients, 'total_staff': total_staff, 'pending_appts': pending_appts,
                    'unpaid_invoices': unpaid_invoices, 'total_revenue': int(total_revenue), 'recent_appts': recent_appts})

@app.route('/api/admin/staff', methods=['GET', 'POST'])
@role_required('admin')
def api_admin_staff():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'POST':
        d = request.get_json()
        try:
            cur.execute('INSERT INTO "user" (username, password, email, role) VALUES (%s,%s,%s,%s) RETURNING user_id',
                        (d['username'], d['password'], d['email'], d['role']))
            uid = cur.fetchone()[0]
            cur.execute('INSERT INTO staff (user_id, s_full_name, role, department) VALUES (%s,%s,%s,%s)',
                        (uid, d['full_name'], d['role'], d.get('department', '')))
            conn.commit()
        except Exception as e:
            conn.rollback(); cur.close(); conn.close()
            return jsonify({'error': str(e)}), 400
    cur.execute('''SELECT s.*, u.email, u.username FROM staff s JOIN "user" u ON s.user_id=u.user_id ORDER BY s.staff_id DESC''')
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/admin/staff/<int:staff_id>', methods=['DELETE'])
@role_required('admin')
def api_delete_staff(staff_id):
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('SELECT user_id FROM staff WHERE staff_id=%s', (staff_id,))
    s = cur.fetchone()
    if s:
        cur.execute('DELETE FROM "user" WHERE user_id=%s', (s['user_id'],))
        conn.commit()
    cur.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/admin/patients')
@role_required('admin')
def api_admin_patients():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT p.*, u.email, u.username FROM patient p JOIN "user" u ON p.user_id=u.user_id ORDER BY p.patient_id DESC''')
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/admin/billing')
@role_required('admin')
def api_admin_billing():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT i.*, p.p_full_name, a.modality, a.scheduled_datetime FROM invoice i
        JOIN patient p ON i.patient_id=p.patient_id JOIN appointment a ON i.appointment_id=a.appointment_id ORDER BY i.due_date DESC''')
    invoices = rows_to_list(cur.fetchall())
    cur.execute("SELECT COALESCE(SUM(total_amount),0) as t FROM invoice WHERE status='paid'"); paid = cur.fetchone()['t']
    cur.execute("SELECT COALESCE(SUM(total_amount),0) as t FROM invoice WHERE status='unpaid'"); unpaid = cur.fetchone()['t']
    cur.close(); conn.close()
    return jsonify({'invoices': invoices, 'paid': int(paid), 'unpaid': int(unpaid)})

@app.route('/api/admin/reports')
@role_required('admin')
def api_admin_reports():
    conn = get_db(); cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''SELECT rr.*, s.s_full_name as radiologist_name, io.modality, io.body_part, p.p_full_name as patient_name
        FROM radiology_report rr JOIN staff s ON rr.radiologist_id=s.staff_id
        JOIN imaging_order io ON rr.order_id=io.order_id JOIN appointment a ON io.appointment_id=a.appointment_id
        JOIN patient p ON a.patient_id=p.patient_id ORDER BY rr.report_date DESC''')
    rows = rows_to_list(cur.fetchall())
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/chatbot', methods=['POST'])
def api_chatbot():
    msg = request.get_json().get('message', '').lower()
    responses = {
        'appointment': 'You can book appointments from your Patient Dashboard under "Book Appointment".',
        'mri': 'MRI is available at NovaRad. Book via your dashboard. Price: 1,500 EGP.',
        'ct': 'CT Scan is available. Price: 1,200 EGP. Book through your patient portal.',
        'x-ray': 'Digital X-Ray is one of our fastest services. Price: 300 EGP.',
        'ultrasound': 'Ultrasound imaging is available. Price: 500 EGP.',
        'billing': 'View and pay invoices from the Billing section in your dashboard.',
        'results': 'Your radiology results appear in Medical Records once signed by the radiologist.',
        'contact': 'Call us at 01117151930.',
        'hours': 'NovaRad is open Saturday-Thursday, 8AM-8PM.',
        'price': 'MRI: 1,500 | CT: 1,200 | X-Ray: 300 | Ultrasound: 500 (all in EGP)',
    }
    for key, reply in responses.items():
        if key in msg:
            return jsonify({'reply': reply})
    return jsonify({'reply': 'Thank you! For immediate assistance, call 01117151930 or log into your patient portal.'})

if __name__ == '__main__':
    try:
        init_db()
        print("Database initialized.")
    except Exception as e:
        print(f"DB warning: {e}")
    app.run(debug=True, port=5000)
