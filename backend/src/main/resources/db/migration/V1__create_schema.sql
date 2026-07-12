-- ============================================
-- TUT Event Handler - PostgreSQL Schema
-- ============================================

-- 1. ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('STUDENT', 'ORGANIZER', 'ADMIN');
CREATE TYPE event_category AS ENUM (
    'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'CAREER_FAIR',
    'SPORTS', 'CULTURAL', 'ACADEMIC', 'HACKATHON',
    'STUDENT_SOCIETY', 'COMMUNITY_OUTREACH', 'ENTERTAINMENT', 'ORIENTATION'
);
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_CLOSED', 'CANCELLED');

-- 2. TABLES
-- ============================================

-- USERS TABLE
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    student_number VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approved ON users(approved);

-- CAMPUS TABLE
CREATE TABLE campus (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campus_name ON campus(name);

-- FACULTY TABLE
CREATE TABLE faculty (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faculty_name ON faculty(name);

-- EVENTS TABLE
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    venue VARCHAR(500) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    category event_category NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    maximum_attendees INTEGER,
    poster_url VARCHAR(1000),
    registration_deadline DATE,
    registration_closed BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT,
    target_audience VARCHAR(500),
    short_summary VARCHAR(1000),
    objectives TEXT,
    attendee_requirements TEXT,
    search_keywords TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    campus_id BIGINT NOT NULL REFERENCES campus(id) ON DELETE RESTRICT,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    organizer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_max_attendees_positive CHECK (maximum_attendees IS NULL OR maximum_attendees > 0),
    CONSTRAINT chk_end_after_start CHECK (end_time > start_time),
    CONSTRAINT chk_registration_deadline CHECK (registration_deadline IS NULL OR registration_deadline >= event_date)
);

CREATE INDEX idx_events_campus ON events(campus_id);
CREATE INDEX idx_events_faculty ON events(faculty_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created ON events(created_at DESC);

-- Full-text search index on title, description, and keywords
CREATE INDEX idx_events_search ON events USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(search_keywords, ''))
);

-- REGISTRATION TABLE
CREATE TABLE registration (
    id BIGSERIAL PRIMARY KEY,
    qr_code_token VARCHAR(255) NOT NULL UNIQUE,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP,
    
    -- Foreign Keys
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_registration_event_student UNIQUE (event_id, student_id),
    CONSTRAINT chk_attended_at CHECK (attended_at IS NULL OR attended_at >= registered_at)
);

CREATE INDEX idx_registration_event ON registration(event_id);
CREATE INDEX idx_registration_student ON registration(student_id);
CREATE INDEX idx_registration_attended ON registration(attended);
CREATE INDEX idx_registration_qr ON registration(qr_code_token);

-- SAVED_EVENTS TABLE (Bookmarks)
CREATE TABLE saved_event (
    id BIGSERIAL PRIMARY KEY,
    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_saved_event_student_event UNIQUE (student_id, event_id)
);

CREATE INDEX idx_saved_event_student ON saved_event(student_id);
CREATE INDEX idx_saved_event_event ON saved_event(event_id);
CREATE INDEX idx_saved_event_saved_at ON saved_event(saved_at DESC);

-- 3. TRIGGER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp (if needed in future)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. SEED DATA
-- ============================================

-- Insert Campuses
INSERT INTO campus (name, city) VALUES
    ('Soshanguve', 'Pretoria'),
    ('Pretoria', 'Pretoria'),
    ('Ga-Rankuwa', 'Pretoria'),
    ('Arcadia', 'Pretoria'),
    ('Mbombela', 'Nelspruit'),
    ('Polokwane', 'Polokwane')
ON CONFLICT (name) DO NOTHING;

-- Insert Faculties
INSERT INTO faculty (name) VALUES
    ('ICT'),
    ('Engineering'),
    ('Management Sciences'),
    ('Arts and Design'),
    ('Humanities'),
    ('ARLC')
ON CONFLICT (name) DO NOTHING;

-- 5. VIEWS (for admin dashboard)
-- ============================================

-- Event summary view with counts
CREATE OR REPLACE VIEW v_event_summary AS
SELECT 
    e.id,
    e.title,
    e.event_date,
    e.start_time,
    e.end_time,
    e.category,
    e.status,
    e.maximum_attendees,
    c.name AS campus_name,
    f.name AS faculty_name,
    u.full_name AS organizer_name,
    u.email AS organizer_email,
    COUNT(DISTINCT r.id) AS registration_count,
    COUNT(DISTINCT CASE WHEN r.attended = TRUE THEN r.id END) AS attendance_count,
    COUNT(DISTINCT se.id) AS saved_count
FROM events e
JOIN campus c ON e.campus_id = c.id
JOIN faculty f ON e.faculty_id = f.id
JOIN users u ON e.organizer_id = u.id
LEFT JOIN registration r ON e.id = r.event_id
LEFT JOIN saved_event se ON e.id = se.event_id
GROUP BY e.id, c.name, f.name, u.full_name, u.email;

-- User summary view
CREATE OR REPLACE VIEW v_user_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.approved,
    u.student_number,
    u.created_at,
    COUNT(DISTINCT e.id) AS events_organized,
    COUNT(DISTINCT r.id) AS registrations_made,
    COUNT(DISTINCT se.id) AS events_saved
FROM users u
LEFT JOIN events e ON u.id = e.organizer_id
LEFT JOIN registration r ON u.id = r.student_id
LEFT JOIN saved_event se ON u.id = se.student_id
GROUP BY u.id;

-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Platform users: students, organizers, and admins';
COMMENT ON TABLE campus IS 'TUT campuses';
COMMENT ON TABLE faculty IS 'TUT faculties';
COMMENT ON TABLE events IS 'Campus events created by organizers';
COMMENT ON TABLE registration IS 'Student registrations with QR code tracking';
COMMENT ON TABLE saved_event IS 'Student bookmarks/saved events';

COMMENT ON COLUMN users.role IS 'STUDENT, ORGANIZER, or ADMIN';
COMMENT ON COLUMN users.approved IS 'Admin approval flag for organizers';
COMMENT ON COLUMN events.status IS 'DRAFT, PUBLISHED, REGISTRATION_CLOSED, or CANCELLED';
COMMENT ON COLUMN registration.qr_code_token IS 'Unique token for QR code generation';
COMMENT ON COLUMN registration.attended IS 'Check-in status via QR scan';

-- 7. GRANTS (adjust as needed for your setup)
-- ============================================

-- Example: Grant permissions to application user
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO tut_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tut_app_user;
-- GRANT SELECT ON v_event_summary, v_user_summary TO tut_app_user;