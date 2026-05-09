from flask import Flask, session, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import re
import os
import uuid
from datetime import datetime, timedelta
from functools import wraps
# Load environment variables from .env file
_env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                os.environ.setdefault(_k.strip(), _v.strip())

PGHOST = 'ep-plain-cloud-ap59nxzp-pooler.c-7.us-east-1.aws.neon.tech'
PGDATABASE = 'neondb'
PGUSER = 'neondb_owner'
PGPASSWORD = 'npg_86RoUyOKwgkF'
# environment variables or a secure vault to store database credentials instead of hardcoding them.
ALLOWED_IMAGE_EXTS = {'dcm', 'jpg', 'jpeg', 'png'}
BOOKING_START_HOUR = 9
BOOKING_END_HOUR = 22  # Exclusive; last slot starts at 21:00


def generate_hourly_slots():
    return [f'{h:02d}:00' for h in range(BOOKING_START_HOUR, BOOKING_END_HOUR)]


def is_valid_booking_slot(dt):
    return (
        BOOKING_START_HOUR <= dt.hour < BOOKING_END_HOUR and
        dt.minute == 0 and dt.second == 0 and dt.microsecond == 0
    )

# Serve React build
REACT_BUILD = os.path.join(os.path.dirname(__file__), 'build')
app = Flask(__name__, static_folder=REACT_BUILD, static_url_path='/')
app.secret_key = 'novarad_secret_2026'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:3000/', 'http://192.168.1.3:3000', 'http://192.168.1.3:3000/'])

# ─── PostgreSQL Schema & DB Admin ─────────────
# This section ensures that the necessary tables and columns exist, and performs any required migrations.
def get_db():
    conn = psycopg2.connect(dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD, host=PGHOST, port=5432)
    conn.autocommit = False
    return conn
# Create imaging_file table if it doesn't exist
# separate step to add the file_data column to avoid issues if the table already existed without it.
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
    conn.commit()
    # Add file_data column separately so it always runs even if table pre-existed
    cursor.execute('ALTER TABLE imaging_file ADD COLUMN IF NOT EXISTS file_data BYTEA')
    conn.commit()
    cursor.close(); conn.close()

try:
    ensure_imaging_file_table()
except Exception as _e:
    print(f'imaging_file table note: {_e}')

# This function ensures that the invoice.status CHECK constraint includes 'refunded' and 'cancelled' to allow those statuses without causing any errors due to the constraint.
def ensure_invoice_refunded_status():
    conn = get_db(); cursor = conn.cursor()
    try:
        # Find and drop existing CHECK constraint on invoice.status if it exists
        cursor.execute("""
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'invoice'
              AND tc.constraint_type = 'CHECK'
              AND cc.check_clause LIKE '%status%'
        """)
        # so if there is an existing CHECK constraint on the status column, we need to drop it before adding the new one that includes 'refunded' and 'cancelled'.
        for (cname,) in cursor.fetchall():
            cursor.execute(f'ALTER TABLE invoice DROP CONSTRAINT "{cname}"')
        cursor.execute("""
            ALTER TABLE invoice ADD CONSTRAINT invoice_status_check
            CHECK (status IN ('unpaid', 'paid', 'refunded', 'cancelled'))
        """)
        conn.commit()
    except Exception as _e:
        conn.rollback()
        print(f'Invoice status migration note: {_e}')
    finally:
        cursor.close(); conn.close()

try:
    ensure_invoice_refunded_status()
except Exception as _e:
    print(f'Invoice status migration outer note: {_e}')

def ensure_imaging_order_cancelled_status():
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'imaging_order'
              AND tc.constraint_type = 'CHECK'
              AND cc.check_clause LIKE '%order_status%'
        """)
        for (cname,) in cursor.fetchall():
            cursor.execute(f'ALTER TABLE imaging_order DROP CONSTRAINT "{cname}"')
        cursor.execute("""
            ALTER TABLE imaging_order ADD CONSTRAINT imaging_order_status_check
            CHECK (order_status IN ('pending', 'in_progress', 'completed', 'cancelled'))
        """)
        conn.commit()
    except Exception as _e:
        conn.rollback()
        print(f'Imaging order status migration note: {_e}')
    finally:
        cursor.close(); conn.close()

try:
    ensure_imaging_order_cancelled_status()
except Exception as _e:
    print(f'Imaging order status migration outer note: {_e}')

# This function ensures that the machine table exists  with some seeds if it was empty.
def ensure_machine_table():
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS machine (
                machine_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                room VARCHAR(50),
                status VARCHAR(20) DEFAULT 'available',
                last_maintenance DATE,
                notes TEXT
            )
        ''')
        cursor.execute('SELECT COUNT(*) FROM machine')
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                'INSERT INTO machine (name, type, room, status) VALUES (%s,%s,%s,%s)',
                [
                    ('MRI Scanner 1',    'MRI',       'Room 101', 'available'),
                    ('MRI Scanner 2',    'MRI',       'Room 102', 'available'),
                    ('CT Scanner 1',     'CT',        'Room 201', 'available'),
                    ('X-Ray Unit 1',     'X-Ray',     'Room 301', 'available'),
                    ('X-Ray Unit 2',     'X-Ray',     'Room 302', 'maintenance'),
                    ('Ultrasound Unit 1','Ultrasound', 'Room 401', 'available'),
                ]
            )
        conn.commit()
    except Exception as _e:
        conn.rollback()
        print(f'Machine table note: {_e}')
    finally:
        cursor.close(); conn.close()

try:
    ensure_machine_table()
except Exception as _e:
    print(f'Machine table outer note: {_e}')

# This function ensures that the appointment table has a radiologist_id column that references staff(staff_id)
# that allows linking appointments to radiologists without causing errors if the column already exists.
def ensure_appointment_radiologist_col():
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE appointment ADD COLUMN IF NOT EXISTS radiologist_id INT REFERENCES staff(staff_id)')
        conn.commit()
    except Exception as _e:
        conn.rollback(); print(f'Appointment radiologist col note: {_e}')
    finally:
        cursor.close(); conn.close()

try:
    ensure_appointment_radiologist_col()
except Exception as _e:
    print(f'Appointment radiologist col outer note: {_e}')

# makes sure that user cant reach any protected part without login
#it redirects him to log in page
def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return func(*args, **kwargs)
    return wrapper

# makes sure that user cant reach any protected part without login and with the right role to each part
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

# change the Database rows to dictionary to be in JSON format
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

# Serve the React app
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

##### Authentication #####
# LOGIN
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    # takes email and password as input
    request_data = request.get_json()
    email = request_data.get('email', '').strip()
    password = request_data.get('password', '').strip()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM "user" WHERE email=%s AND password=%s', (email, password)) #checks if email and password stored in database
    user = cursor.fetchone()
    if not user:
        cursor.close(); conn.close()
        return jsonify({'error': 'Invalid email or password'}), 401
    # if info was correct then it stores the user info in the session
    session['user_id'] = user['user_id']
    session['username'] = user['username']
    session['role'] = user['role']
    session['email'] = user['email']
    role = user['role']
    full_name = user['username']
    # checks the role and accroding to it gets the data from database
    if role == 'patient':
        cursor.execute('SELECT patient_id, p_full_name FROM patient WHERE user_id=%s', (user['user_id'],))
        patient = cursor.fetchone()
        if patient:
            session['patient_id'] = patient['patient_id']
            full_name = patient['p_full_name'] or full_name
    else:
        cursor.execute('SELECT staff_id, s_full_name FROM staff WHERE user_id=%s', (user['user_id'],))
        staff = cursor.fetchone()
        if staff:
            session['staff_id'] = staff['staff_id']
            full_name = staff['s_full_name'] or full_name
    session['full_name'] = full_name
    cursor.close(); conn.close()
    return jsonify({'user_id': session['user_id'], 'username': session['username'], 'role': role, 'email': session['email'], 'full_name': full_name})

# LOGOUT
@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear() #clears the session to log out the user
    return jsonify({'ok': True})

# Get current user info
@app.route('/api/auth/me')
def api_me():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({'user_id': session['user_id'], 'username': session['username'], 'role': session['role'], 'email': session['email'], 'full_name': session.get('full_name', session['username']), 'staff_id': session.get('staff_id'), 'patient_id': session.get('patient_id')})

# REGISTER
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    # asks the user to enter his info
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

# [Mohamed Mostafa] Patient Dashboard
@app.route('/api/patient/dashboard')
@role_required('patient')
def api_patient_dashboard():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM patient WHERE patient_id=%s', (patient_id,))
    patient = row_to_dict(cursor.fetchone())
    cursor.execute('''SELECT appointment.*, t.s_full_name as staff_name, r.s_full_name as radiologist_name
        FROM appointment
        LEFT JOIN staff t ON appointment.staff_id=t.staff_id
        LEFT JOIN staff r ON appointment.radiologist_id=r.staff_id
        WHERE appointment.patient_id=%s ORDER BY appointment.scheduled_datetime DESC LIMIT 5''', (patient_id,))
    appointments = rows_to_list(cursor.fetchall())
    cursor.execute('SELECT * FROM invoice WHERE patient_id=%s ORDER BY due_date DESC LIMIT 5', (patient_id,))
    invoices = rows_to_list(cursor.fetchall())
    cursor.execute('''SELECT medical_record.*, radiology_report.findings_and_impression, radiology_report.report_date, radiology_report.signed FROM medical_record
        LEFT JOIN radiology_report ON medical_record.report_id=radiology_report.report_id WHERE medical_record.patient_id=%s ORDER BY medical_record.date_created DESC LIMIT 5''', (patient_id,))
    records = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'patient': patient, 'appointments': appointments, 'invoices': invoices, 'records': records})

# Patient Profile
@app.route('/api/patient/profile', methods=['GET', 'PUT'])
@role_required('patient') #makes sure role is patient
def api_patient_profile():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    if request.method == 'PUT': #allow patient to update his profile
        request_data = request.get_json()
        cursor.execute('UPDATE patient SET phone=%s, address=%s, blood_type=%s, medical_history=%s WHERE patient_id=%s',
                    (request_data.get('phone'), request_data.get('address'), request_data.get('blood_type'), request_data.get('medical_history'), patient_id))
        conn.commit()
    cursor.execute('SELECT * FROM patient WHERE patient_id=%s', (patient_id,))
    patient = row_to_dict(cursor.fetchone())
    cursor.close(); conn.close()
    return jsonify(patient)

# Appointments
@app.route('/api/patient/appointments')
@role_required('patient')
def api_patient_appointments():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT appointment.*, t.s_full_name as staff_name, r.s_full_name as radiologist_name
        FROM appointment
        LEFT JOIN staff t ON appointment.staff_id=t.staff_id
        LEFT JOIN staff r ON appointment.radiologist_id=r.staff_id
        WHERE appointment.patient_id=%s ORDER BY appointment.scheduled_datetime DESC''', (patient_id,)) #gets the appointments of the patient and the staff and radiologist names
    rows = rows_to_list(cursor.fetchall()) #changes data to rows to be in JSON format
    cursor.close(); conn.close()
    return jsonify(rows)

# referring doctors list for dropdown in booking form
@app.route('/api/patient/referring-doctors')
@role_required('patient')
def api_patient_referring_doctors():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''
        SELECT staff_id, s_full_name, department
        FROM staff
        WHERE role='radiologist'
        ORDER BY s_full_name ASC
    ''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

# available slots for a given date
@app.route('/api/patient/available-slots')
@role_required('patient')
def api_patient_available_slots():
    date_str = (request.args.get('date') or '').strip()
    if not date_str:
        return jsonify({'error': 'date is required (YYYY-MM-DD)'}), 400
    try:
        selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    now = datetime.now()
    all_slots = generate_hourly_slots()
    # Get all taken slots for the selected date
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''
        SELECT scheduled_datetime
        FROM appointment
        WHERE DATE(scheduled_datetime)=%s AND status!='cancelled'
    ''', (selected_date,))
    taken = {f"{r['scheduled_datetime'].hour:02d}:{r['scheduled_datetime'].minute:02d}" for r in cursor.fetchall()}
    cursor.close(); conn.close()
    # Filter out taken and past slots
    available = []
    for s in all_slots:
        slot_dt = datetime.fromisoformat(f'{selected_date.isoformat()}T{s}:00')
        if s in taken:
            continue
        if slot_dt <= now:
            continue
        available.append(s)

    return jsonify({'date': selected_date.isoformat(), 'slots': available})

#book appointment
@app.route('/api/patient/book-appointment', methods=['POST'])
@role_required('patient')
def api_book_appointment():
    patient_id = session['patient_id']
    request_data = request.get_json()
    modality = request_data.get('modality', '')
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    dept_keyword = {
        'MRI':       'MRI',
        'CT':        'CT',
        'X-Ray':     'X-Ray',
        'Ultrasound':'Ultrasound',
    }.get(modality)
    # try to find a technician/radiologist in the relevant department
    staff_id = None
    if dept_keyword:
        cursor.execute(
            "SELECT staff_id FROM staff WHERE department ILIKE %s AND role IN ('technician','radiologist') LIMIT 1",
            (f'%{dept_keyword}%',)
        )
        result = cursor.fetchone()
        if result:
            staff_id = result['staff_id']
    # if not found, assign any available technician/receptionist
    if not staff_id:
        cursor.execute("SELECT staff_id FROM staff WHERE role IN ('technician','receptionist') LIMIT 1")
        result = cursor.fetchone()
        if result:
            staff_id = result['staff_id']     
    # if still not found, assign any staff
    radiologist_id = None
    selected_radiologist_id = request_data.get('radiologist_id')
    if selected_radiologist_id:
        try:
            selected_radiologist_id = int(selected_radiologist_id)
        except (TypeError, ValueError):
            selected_radiologist_id = None
    if selected_radiologist_id:
        cursor.execute(
            "SELECT staff_id FROM staff WHERE staff_id=%s AND role='radiologist'",
            (selected_radiologist_id,)
        )
        rad_result = cursor.fetchone()
        if rad_result:
            radiologist_id = rad_result['staff_id']

    if not radiologist_id:
        # Assign radiologist by department; pick randomly if no preference was chosen.
        rad_dept_keyword = {
            'MRI':       'Diagnostic',
            'CT':        'Diagnostic',
            'X-Ray':     'Diagnostic',
            'Ultrasound':'Diagnostic',
        }.get(modality, 'Diagnostic')

        cursor.execute(
            "SELECT staff_id FROM staff WHERE role='radiologist' AND department ILIKE %s ORDER BY RANDOM() LIMIT 1",
            (f'%{rad_dept_keyword}%',)
        )
        rad_result = cursor.fetchone()
        if not rad_result:
            cursor.execute("SELECT staff_id FROM staff WHERE role='radiologist' ORDER BY RANDOM() LIMIT 1")
            rad_result = cursor.fetchone()
        radiologist_id = rad_result['staff_id'] if rad_result else None

    # Validate scheduled_datetime (correct format, in the future, in allowed time slots)
    scheduled_str = request_data.get('scheduled_datetime')
    try:
        scheduled_dt = datetime.fromisoformat(scheduled_str)
    except (TypeError, ValueError):
        cursor.close(); conn.close()
        return jsonify({'error': 'Invalid date format.'}), 400
    if scheduled_dt <= datetime.now():
        cursor.close(); conn.close()
        return jsonify({'error': 'Appointment date must be in the future.'}), 400
    if not is_valid_booking_slot(scheduled_dt):
        cursor.close(); conn.close()
        return jsonify({'error': 'Appointments are only available hourly from 09:00 to 21:00.'}), 400

    cursor.execute(
        "SELECT 1 FROM appointment WHERE scheduled_datetime=%s AND status!='cancelled' LIMIT 1",
        (scheduled_dt,)
    )
    if cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({'error': 'This time slot is no longer available. Please choose another slot.'}), 400
    
    price_map = {'MRI': 1500, 'CT': 1200, 'X-Ray': 300, 'Ultrasound': 500}
    amount = price_map.get(modality, 800)
    due_date = (datetime.now() + timedelta(days=30)).date()
    # Create appointment, imaging order, and invoice in a transaction
    try:
        cursor.execute('INSERT INTO appointment (patient_id, staff_id, radiologist_id, scheduled_datetime, modality, status) VALUES (%s,%s,%s,%s,%s,%s) RETURNING appointment_id',
                    (patient_id, staff_id, radiologist_id, scheduled_dt, modality, 'scheduled'))
        appointment_id = cursor.fetchone()[0]
        cursor.execute('INSERT INTO imaging_order (appointment_id, referring_doctor, body_part, modality, order_status) VALUES (%s,%s,%s,%s,%s)',
                    (appointment_id, request_data.get('referring_doctor'), request_data.get('body_part'), modality, 'pending'))
        cursor.execute('INSERT INTO invoice (patient_id, appointment_id, total_amount, status, due_date) VALUES (%s,%s,%s,%s,%s)',
                    (patient_id, appointment_id, amount, 'unpaid', due_date))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400
    
# Cancel appointment
@app.route('/api/patient/cancel-appointment/<int:appointment_id>', methods=['POST'])
@role_required('patient')
def api_cancel_appointment(appointment_id):
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s AND patient_id=%s', ('cancelled', appointment_id, patient_id))
        if cursor.rowcount == 0:
            conn.rollback(); cursor.close(); conn.close()
            return jsonify({'error': 'Appointment not found or already cancelled'}), 404
        cursor.execute("UPDATE invoice SET status='refunded' WHERE appointment_id=%s AND status='paid'", (appointment_id,))
        cursor.execute("UPDATE invoice SET status='cancelled' WHERE appointment_id=%s AND status='unpaid'", (appointment_id,))
        cursor.execute("UPDATE imaging_order SET order_status='cancelled' WHERE appointment_id=%s", (appointment_id,))
        conn.commit(); cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# [Mohamed Mostafa] Billing & Payments — Patient Billing + Pay Invoice
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

# Medical Records
@app.route('/api/patient/records')
@role_required('patient')
def api_patient_records():
    patient_id = session['patient_id']
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    # retunrs all medical records of patient with reports and staff names
    cursor.execute('''SELECT medical_record.*, radiology_report.findings_and_impression, radiology_report.report_date, radiology_report.signed, radiology_report.order_id, staff.s_full_name as staff_name
        FROM medical_record LEFT JOIN radiology_report ON medical_record.report_id=radiology_report.report_id
        LEFT JOIN staff ON medical_record.staff_id=staff.staff_id WHERE medical_record.patient_id=%s ORDER BY medical_record.date_created DESC''', (patient_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

# ─── Staff API ──────────────────────────────────────────────────

# [Mohamed Mostafa] Staff Dashboard
@app.route('/api/staff/dashboard')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_dashboard():
    role = session.get('role')
    staff_id = session.get('staff_id')
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    appt_filter = ''
    appt_params = []
    if role == 'technician':
        appt_filter = ' AND appointment.staff_id=%s'
        appt_params = [staff_id]
    elif role == 'radiologist':
        appt_filter = ' AND appointment.radiologist_id=%s'
        appt_params = [staff_id]
    cursor.execute(f'''SELECT appointment.*, patient.p_full_name as patient_name FROM appointment JOIN patient ON appointment.patient_id=patient.patient_id
        WHERE appointment.status='scheduled'{appt_filter} ORDER BY appointment.scheduled_datetime ASC LIMIT 10''', appt_params)
    appointments = rows_to_list(cursor.fetchall())
    order_filter = ''
    order_params = []
    if role == 'technician':
        order_filter = ' AND appointment.staff_id=%s'
        order_params = [staff_id]
    elif role == 'radiologist':
        order_filter = ' AND appointment.radiologist_id=%s'
        order_params = [staff_id]
    cursor.execute(f'''SELECT imaging_order.*, appointment.scheduled_datetime, appointment.modality, patient.p_full_name as patient_name
        FROM imaging_order JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
        JOIN patient ON appointment.patient_id=patient.patient_id WHERE imaging_order.order_status NOT IN ('completed', 'cancelled'){order_filter} ORDER BY appointment.scheduled_datetime ASC LIMIT 10''', order_params)
    orders = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'appointments': appointments, 'orders': orders})

# Appointments List & Management in staff dashboard
@app.route('/api/staff/appointments')
@role_required('radiologist', 'technician', 'receptionist')
def api_staff_appointments():
    role = session.get('role')
    staff_id = session.get('staff_id')
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    appt_filter = ''
    appt_params = []
    if role == 'technician':
        appt_filter = ' WHERE appointment.staff_id=%s'
        appt_params = [staff_id]
    elif role == 'radiologist':
        appt_filter = ' WHERE appointment.radiologist_id=%s'
        appt_params = [staff_id]
    cursor.execute(f'''SELECT appointment.*, patient.p_full_name as patient_name, patient.phone as patient_phone,
        t.s_full_name as staff_name, r.s_full_name as radiologist_name
        FROM appointment
        JOIN patient ON appointment.patient_id=patient.patient_id
        LEFT JOIN staff t ON appointment.staff_id=t.staff_id
        LEFT JOIN staff r ON appointment.radiologist_id=r.staff_id{appt_filter}
        ORDER BY appointment.scheduled_datetime DESC''', appt_params)
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

# Update appointment status for patients
@app.route('/api/staff/update-appointment/<int:appointment_id>', methods=['POST'])
@role_required('radiologist', 'technician', 'receptionist')
def api_update_appointment(appointment_id):
    request_data = request.get_json()
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('UPDATE appointment SET status=%s WHERE appointment_id=%s', (request_data.get('status'), appointment_id))
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

# [Mohamed Mostafa] Imaging Orders & Radiology Reports — List Orders, Update Order, Report GET/POST
@app.route('/api/staff/imaging-orders')
@role_required('radiologist', 'technician', 'receptionist')
def api_imaging_orders():
    role = session.get('role')
    staff_id = session.get('staff_id')
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    order_filter = ''
    order_params = []
    if role == 'technician':
        order_filter = ' WHERE appointment.staff_id=%s'
        order_params = [staff_id]
    elif role == 'radiologist':
        order_filter = ' WHERE appointment.radiologist_id=%s'
        order_params = [staff_id]
    cursor.execute(f'''SELECT imaging_order.*, appointment.scheduled_datetime, appointment.modality, patient.p_full_name as patient_name, radiology_report.report_id, radiology_report.signed
        FROM imaging_order JOIN appointment ON imaging_order.appointment_id=appointment.appointment_id
        JOIN patient ON appointment.patient_id=patient.patient_id LEFT JOIN radiology_report ON radiology_report.order_id=imaging_order.order_id{order_filter}
        ORDER BY appointment.scheduled_datetime DESC''', order_params)
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

@app.route('/api/staff/images/<int:file_id>', methods=['DELETE'])
@role_required('receptionist', 'technician', 'radiologist', 'admin')
def api_delete_image(file_id):
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM imaging_file WHERE file_id=%s', (file_id,))
        conn.commit(); cursor.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# [Mohamed Mostafa] Imaging Orders & Radiology Reports — Machines
@app.route('/api/staff/machines')
@role_required('radiologist', 'technician', 'receptionist', 'admin')
def api_get_machines():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT * FROM machine ORDER BY type, machine_id')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/staff/machines/<int:machine_id>', methods=['PUT'])
@role_required('technician', 'admin')
def api_update_machine(machine_id):
    data = request.get_json()
    conn = get_db(); cursor = conn.cursor()
    fields, vals = [], []
    for col in ('status', 'notes', 'last_maintenance'):
        if col in data:
            fields.append(f'{col}=%s')
            vals.append(data[col])
    if not fields:
        return jsonify({'error': 'Nothing to update'}), 400
    vals.append(machine_id)
    cursor.execute(f'UPDATE machine SET {", ".join(fields)} WHERE machine_id=%s', vals)
    conn.commit(); cursor.close(); conn.close()
    return jsonify({'ok': True})

# ─── Admin API ──────────────────────────────────────────────────

# [Mohamed Mostafa] Admin Dashboard
@app.route('/api/admin/dashboard')
@role_required('admin')
def api_admin_dashboard():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT COUNT(*) as cnt FROM patient'); total_patients = cursor.fetchone()['cnt']
    cursor.execute('SELECT COUNT(*) as cnt FROM staff'); total_staff = cursor.fetchone()['cnt']
    cursor.execute("SELECT COUNT(*) as cnt FROM appointment WHERE status='scheduled'"); pending_appts = cursor.fetchone()['cnt']
    cursor.execute("SELECT COUNT(*) as cnt FROM invoice WHERE status='unpaid'"); unpaid_invoices = cursor.fetchone()['cnt']
    cursor.execute("SELECT COALESCE(SUM(total_amount),0) as total FROM invoice WHERE status='paid'"); total_revenue = cursor.fetchone()['total']
    cursor.execute('''SELECT appointment.*, patient.p_full_name as patient_name,
        t.s_full_name as staff_name, r.s_full_name as radiologist_name
        FROM appointment
        JOIN patient ON appointment.patient_id=patient.patient_id
        LEFT JOIN staff t ON appointment.staff_id=t.staff_id
        LEFT JOIN staff r ON appointment.radiologist_id=r.staff_id
        ORDER BY appointment.scheduled_datetime DESC LIMIT 10''')
    recent_appts = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify({'total_patients': total_patients, 'total_staff': total_staff, 'pending_appts': pending_appts,
                    'unpaid_invoices': unpaid_invoices, 'total_revenue': int(total_revenue), 'recent_appts': recent_appts})

# [Mohamed Mostafa] Admin Management — Staff CRUD + Patients List
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
    cursor.execute('''SELECT staff.*, u.email, u.username FROM staff JOIN "user" u ON staff.user_id=u.user_id ORDER BY staff.staff_id DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

@app.route('/api/admin/staff/<int:staff_id>', methods=['DELETE'])
@role_required('admin')
def api_delete_staff(staff_id):
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT user_id, role FROM staff WHERE staff_id=%s', (staff_id,))
    staff_result = cursor.fetchone()
    if not staff_result:
        cursor.close(); conn.close()
        return jsonify({'error': 'Staff member not found.'}), 404

    cursor.execute('SELECT COUNT(*) as cnt FROM appointment WHERE staff_id=%s OR radiologist_id=%s', (staff_id, staff_id))
    appt_count = cursor.fetchone()['cnt']
    cursor.execute('SELECT COUNT(*) as cnt FROM radiology_report WHERE radiologist_id=%s', (staff_id,))
    report_count = cursor.fetchone()['cnt']
    cursor.execute('SELECT COUNT(*) as cnt FROM medical_record WHERE staff_id=%s', (staff_id,))
    record_count = cursor.fetchone()['cnt']

    role = staff_result['role']
    replacement_staff_id = None
    if appt_count:
        if role == 'radiologist':
            cursor.execute("SELECT staff_id FROM staff WHERE role='radiologist' AND staff_id!=%s ORDER BY RANDOM() LIMIT 1", (staff_id,))
            replacement = cursor.fetchone()
            replacement_staff_id = replacement['staff_id'] if replacement else None
            if not replacement_staff_id:
                cursor.close(); conn.close()
                return jsonify({'error': 'No other radiologist available to reassign appointments.'}), 409
            cursor.execute('UPDATE appointment SET radiologist_id=%s WHERE radiologist_id=%s', (replacement_staff_id, staff_id))
        elif role == 'technician':
            cursor.execute("SELECT staff_id FROM staff WHERE role='technician' AND staff_id!=%s ORDER BY RANDOM() LIMIT 1", (staff_id,))
            replacement = cursor.fetchone()
            replacement_staff_id = replacement['staff_id'] if replacement else None
            if not replacement_staff_id:
                cursor.close(); conn.close()
                return jsonify({'error': 'No other technician available to reassign appointments.'}), 409
            cursor.execute('UPDATE appointment SET staff_id=%s WHERE staff_id=%s', (replacement_staff_id, staff_id))

    if report_count or record_count:
        cursor.close(); conn.close()
        return jsonify({
            'error': 'Cannot delete staff with linked reports or medical records.'
        }), 409

    try:
        cursor.execute('DELETE FROM staff WHERE staff_id=%s', (staff_id,))
        cursor.execute('DELETE FROM "user" WHERE user_id=%s', (staff_result['user_id'],))
        conn.commit()
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

    cursor.close(); conn.close()
    return jsonify({'ok': True})

@app.route('/api/admin/patients')
@role_required('admin')
def api_admin_patients():
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('''SELECT patient.*, u.email, u.username FROM patient JOIN "user" u ON patient.user_id=u.user_id ORDER BY patient.patient_id DESC''')
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    return jsonify(rows)

# [Mohamed Mostafa] Billing & Payments — Admin Billing
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

# [Mohamed Mostafa] Imaging Orders & Radiology Reports — Admin Reports
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

# upload images for an order (allowed image types: DCM, JPG, JPEG, PNG)
@app.route('/api/staff/upload-image/<int:order_id>', methods=['POST'])
@role_required('receptionist', 'technician', 'radiologist', 'admin')
def api_upload_image(order_id):
    import io
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty filename'}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_IMAGE_EXTS:
        return jsonify({'error': 'Invalid file type. Allowed: DCM, JPG, JPEG, PNG'}), 400

    stored_ext = 'png' if ext == 'dcm' else ext
    stored_name = f"{uuid.uuid4().hex}.{stored_ext}"
    # If DICOM, convert to PNG first
    if ext == 'dcm':
        try:
            import pydicom, numpy as np
            from PIL import Image
            ds = pydicom.dcmread(io.BytesIO(file.read()))
            arr = ds.pixel_array.astype(float)
            low, high = arr.min(), arr.max()
            if high > low:
                arr = ((arr - low) / (high - low) * 255).astype(np.uint8) # normalize to 0-255
            else:
                arr = arr.astype(np.uint8)
            # if image is gray change it to RGB
            if arr.ndim == 2:
                img = Image.fromarray(arr, mode='L').convert('RGB')
            else:
                img = Image.fromarray(arr) #changes it to PIL image, image object
            buf = io.BytesIO() # add image to buffer
            img.save(buf, format='PNG') #saves image as PNG
            file_bytes = buf.getvalue() # get bytes data of the image
        except Exception as e:
            return jsonify({'error': f'DICOM conversion failed: {str(e)}'}), 400
    else:
        file_bytes = file.read()
    
    # Store in DB
    conn = get_db(); cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO imaging_file (order_id, filename, original_name, file_type, file_data) VALUES (%s,%s,%s,%s,%s) RETURNING file_id',
            (order_id, stored_name, file.filename, stored_ext, psycopg2.Binary(file_bytes))
        )
        file_id = cursor.fetchone()[0]
        conn.commit(); cursor.close(); conn.close()
        return jsonify({'ok': True, 'file_id': file_id, 'filename': stored_name, 'url': f'/api/uploads/{stored_name}'})
    except Exception as e:
        conn.rollback(); cursor.close(); conn.close()
        return jsonify({'error': str(e)}), 400

# get all images for an order
@app.route('/api/staff/images/<int:order_id>')
@login_required
def api_get_images(order_id):
    conn = get_db(); cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute('SELECT file_id, order_id, filename, original_name, file_type, uploaded_at FROM imaging_file WHERE order_id=%s ORDER BY uploaded_at', (order_id,))
    rows = rows_to_list(cursor.fetchall())
    cursor.close(); conn.close()
    for row in rows:
        row['url'] = f"/api/uploads/{row['filename']}"
    return jsonify(rows)

# serve uploaded image by filename
@app.route('/api/uploads/<filename>')
@login_required
def serve_upload(filename):
    safe = os.path.basename(filename)
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('SELECT file_data, file_type FROM imaging_file WHERE filename=%s', (safe,))
    row = cursor.fetchone()
    cursor.close(); conn.close()
    if not row or row[0] is None:
        return jsonify({'error': 'Image not found'}), 404
    mime = 'image/png' if row[1] in ('png', 'dcm') else f'image/{row[1]}'
    return Response(bytes(row[0]), mimetype=mime)

#chatbot scenarios
NOVA_SCENARIOS = [
    # Greetings
    (['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'salam', 'السلام'],
     "Hello! Welcome to NovaRad Center. I'm Nova, your assistant. I can help you book appointments, check service prices, pay invoices, view your results, or navigate the portal. What can I help you with today?"),

    # How to book / booking steps
    (['how to book', 'how do i book', 'how can i book', 'want to book', 'schedule appointment', 'make appointment', 'book appointment', 'new appointment'],
     "To book an appointment:\n1. Log in to your Patient Dashboard\n2. Click 'Book Appointment' in the left sidebar\n3. Choose your imaging type (MRI, CT Scan, X-Ray, or Ultrasound)\n4. Enter the body part to be examined\n5. Pick any future date and time\n6. Click 'Confirm Appointment'\nAn invoice will be generated automatically and is due within 30 days."),

    # Cancel appointment
    (['cancel appointment', 'cancel my appointment', 'how to cancel', 'delete appointment', 'remove appointment'],
     "To cancel an appointment:\n1. Go to 'My Appointments' in your dashboard\n2. Find the appointment you want to cancel\n3. Click the 'Cancel' button next to it\nNote: you can only cancel appointments that still have 'Scheduled' status. Once an appointment is completed or already cancelled, it cannot be changed."),

    # Reschedule
    (['reschedule', 'change appointment', 'change date', 'change time', 'move appointment'],
     "To reschedule an appointment, you need to cancel the existing one first, then book a new appointment with your preferred date and time. Go to 'My Appointments' to cancel, then 'Book Appointment' to create a new one."),

    # View appointments
    (['my appointments', 'view appointments', 'see appointments', 'check appointments', 'appointment status', 'appointment list'],
     "You can view all your appointments by clicking 'My Appointments' in the left sidebar of your Patient Dashboard. There you can see the date, modality, assigned staff, and current status of each appointment."),

    # MRI
    (['mri', 'magnetic resonance'],
     "MRI (Magnetic Resonance Imaging) is available at NovaRad for 1,500 EGP. It provides detailed images of soft tissues and organs using magnetic fields — no radiation involved. To book an MRI: Patient Dashboard -> Book Appointment -> select MRI -> enter body part and preferred time."),

    # CT
    (['ct scan', 'ct-scan', 'computed tomography', ' ct '],
     "CT Scan (Computed Tomography) is available at NovaRad for 1,200 EGP. It uses X-rays to create detailed cross-sectional images of the body. To book: Patient Dashboard -> Book Appointment -> select CT -> enter body part and preferred time."),

    # X-Ray
    (['x-ray', 'xray', 'x ray'],
     "X-Ray is our fastest and most affordable service at 300 EGP. It is commonly used for bones, chest, and lungs. To book: Patient Dashboard -> Book Appointment -> select X-Ray -> enter body part and preferred time."),

    # Ultrasound
    (['ultrasound', 'sonography', 'echo'],
     "Ultrasound imaging is available at NovaRad for 500 EGP. It uses sound waves to create images of organs and is completely safe with no radiation. To book: Patient Dashboard -> Book Appointment -> select Ultrasound -> enter body part and preferred time."),

    # Prices / cost
    (['price', 'cost', 'how much', 'fees', 'charges', 'tariff', 'كم', 'سعر'],
     "Our service prices:\n- MRI: 1,500 EGP\n- CT Scan: 1,200 EGP\n- X-Ray: 300 EGP\n- Ultrasound: 500 EGP\nAll invoices are generated automatically when you book and are due within 30 days."),

    # Payment / pay invoice
    (['how to pay', 'pay invoice', 'pay bill', 'payment', 'pay now', 'online pay'],
     "To pay an invoice:\n1. Go to 'Billing & Payments' in your dashboard sidebar\n2. Find the invoice marked as 'Unpaid'\n3. Click the 'Pay Now' button\n4. Enter your Visa card details (card number, name, expiry, CVV)\n5. Click 'Pay [amount] EGP' to confirm\nYour invoice status will update to 'Paid' instantly."),

    # Billing / invoices
    (['billing', 'invoice', 'bill', 'invoices', 'balance', 'outstanding'],
     "Invoices are automatically created when you book an appointment. To view them, go to 'Billing & Payments' in your dashboard. You will see your total paid amount, outstanding balance, and a full invoice history. Click 'Pay Now' on any unpaid invoice to settle it."),

    # Results / report
    (['my results', 'see results', 'view results', 'get results', 'radiology report', 'scan results', 'imaging results'],
     "Your radiology results appear in the 'Medical Records' section of your dashboard. They become visible only after the radiologist has written and digitally signed the report. Click on any record to expand it and read the full findings and clinical impression. If your record is signed, you will also see the uploaded scan images."),

    # Medical records
    (['medical record', 'my record', 'records', 'history', 'previous scan'],
     "Your medical records are in the 'Medical Records' section of your Patient Dashboard. Each record includes the radiologist's findings and impression, the report date, and any uploaded scan images. Records only appear after the radiologist signs the report."),

    # Images / scans
    (['image', 'scan image', 'dicom', 'see image', 'view image', 'picture'],
     "Scan images are attached to your medical records. To view them:\n1. Go to 'Medical Records' in your dashboard\n2. Click on a record to expand it\n3. You will see a grid of your scan images below the report\n4. Click any image to view it in full screen\nImages are uploaded by the technician or radiologist after your imaging session."),

    # Registration
    (['register', 'sign up', 'create account', 'new account', 'how to register'],
     "To create a patient account:\n1. Go to the NovaRad login page\n2. Click 'Register'\n3. Fill in your personal details (name, SSN, phone, date of birth, etc.)\n4. Enter your email and choose a password\n5. Click 'Create Account'\nAfter registering, log in with your email and password to access your dashboard."),

    # Login
    (['login', 'log in', 'sign in', 'forgot password', 'cant login', "can't login"],
     "To log in: go to the NovaRad homepage and click 'Login'. Enter your registered email address and password. If you do not have an account yet, click 'Register' to create one. Make sure you are using the correct email you registered with."),

    # Profile / account
    (['my profile', 'edit profile', 'update profile', 'change profile', 'personal info'],
     "To view or update your profile, click 'My Profile' in your Patient Dashboard sidebar. You can update your phone number, address, blood type, and medical history. Click 'Save Changes' when done."),

    # Contact
    (['contact', 'phone', 'call', 'telephone', 'reach', 'تواصل'],
     "You can reach NovaRad Center at:\n- Phone: 01117151930\n- Working hours: Saturday to Thursday, 8 AM to 8 PM\nFeel free to call us for any questions not covered in the portal."),

    # Working hours
    (['hours', 'working hours', 'open', 'opening', 'when open', 'schedule', 'timing'],
     "NovaRad Center is open Saturday to Thursday from 8:00 AM to 8:00 PM. We are closed on Fridays. When booking appointments, you must select a future date and time within our working hours."),

    # Staff / doctor / radiologist
    (['doctor', 'radiologist', 'staff', 'technician', 'who will', 'assigned'],
     "When you book an appointment, a staff member is automatically assigned to your case. The radiologist will perform your imaging session and write a detailed report. You will see the assigned staff name in your 'My Appointments' page."),

    # Report not showing / waiting
    (['not showing', 'not visible', 'where is my', 'waiting for', 'not ready', "can't see"],
     "If your results are not showing yet, it means the radiologist has not signed the report yet. Reports become visible in 'Medical Records' only after the radiologist completes and digitally signs them. This usually happens within 1-2 business days after your imaging session."),

    # Thank you
    (['thank', 'thanks', 'thank you', 'shukran', 'شكرا'],
     "You're welcome! If you have any other questions about your appointments, results, billing, or anything else, feel free to ask. NovaRad is here to help you."),

    # General help
    (['help', 'what can you do', 'what do you do', 'assist', 'support'],
     "I'm Nova, your NovaRad assistant. Here is what I can help you with:\n- How to book, cancel, or reschedule appointments\n- Service prices (MRI, CT, X-Ray, Ultrasound)\n- How to pay invoices online\n- Viewing your radiology results and scan images\n- Understanding your medical records\n- Registration and login\n- Contacting the center\nJust type your question and I'll guide you!"),
]

def nova_reply(msg):
    ml = msg.lower()
    for keywords, reply in NOVA_SCENARIOS:
        if any(k in ml for k in keywords):
            return reply
    return ("I'm not sure about that specific question, but I can help you with:\n"
            "- Booking or cancelling appointments\n"
            "- Service prices (MRI: 1,500 | CT: 1,200 | X-Ray: 300 | Ultrasound: 500 EGP)\n"
            "- Paying invoices in the Billing section\n"
            "- Viewing results in Medical Records\n"
            "- Registration and login\n"
            "For direct assistance, call us at 01117151930 (Sat-Thu, 8AM-8PM).")

@app.route('/api/chatbot', methods=['POST'])
def api_chatbot():
    body = request.get_json() or {}
    msg = body.get('message', '').strip()
    if not msg:
        return jsonify({'reply': 'Please type a message.'})
    return jsonify({'reply': nova_reply(msg)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
