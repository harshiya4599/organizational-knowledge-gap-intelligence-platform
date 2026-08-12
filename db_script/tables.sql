SET search_path TO organization;

-- ==========================================
-- Roles Table
-- ==========================================

CREATE TABLE roles (
    role_id SERIAL,
    role_name VARCHAR(50),
    description VARCHAR(255) -- Added to match Role.java
);

-- ==========================================
-- Users Table
-- ==========================================

CREATE TABLE users (
    user_id SERIAL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT
);

-- ==========================================
-- Departments Table
-- ==========================================

CREATE TABLE departments (
    department_id SERIAL,
    department_name VARCHAR(100)
);

-- ==========================================
-- Employees Table
-- ==========================================

CREATE TABLE organization.employees (
    id BIGINT PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    user_id BIGINT,
    department_id BIGINT,
    salary NUMERIC,
    joining_date DATE,
    phone VARCHAR(10),
    employee_code VARCHAR(255),
    name VARCHAR(100),
    email VARCHAR(255),
    designation VARCHAR(255)
);

-- ==========================================
-- Skills Table
-- ==========================================

CREATE TABLE skills (
    skill_id SERIAL,
    skill_name VARCHAR(100) NOT NULL,
    description TEXT, -- Added to match Skill.java
    category VARCHAR(50)
);

-- ==========================================
-- Employee Skills Table
-- ==========================================

CREATE TABLE organization.employee_skills (
    id BIGINT PRIMARY KEY,
    employee_skill_id BIGINT,
    employee_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    level INTEGER -- Renamed from skill_level
);

-- ==========================================
-- Department Competencies Table
-- ==========================================

CREATE TABLE department_competencies (
    competency_id SERIAL,
    department_id INT NOT NULL,
    competency_name VARCHAR(100) NOT NULL,
    required_level INT CHECK (required_level BETWEEN 1 AND 5)
);

-- ==========================================
-- Gap Analysis Table
-- ==========================================

CREATE TABLE gap_analysis (
    gap_id SERIAL,
    employee_id INT NOT NULL,
    skill_id INT NOT NULL,
    current_level INT CHECK (current_level BETWEEN 1 AND 5),
    required_level INT CHECK (required_level BETWEEN 1 AND 5),
    gap_level INT GENERATED ALWAYS AS (required_level - current_level) STORED,
    status VARCHAR(20) DEFAULT 'Open'
);

-- ==========================================
-- Training Recommendations Table
-- ==========================================

CREATE TABLE training_recommendations (
    recommendation_id SERIAL,
    gap_id INT NOT NULL,
    training_name VARCHAR(150) NOT NULL,
    provider VARCHAR(100),
    duration VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Recommended'
);
-- ==========================================
-- Goal 2: Learning & Analytics Tables
-- ==========================================

CREATE TABLE organization.trainings (
    training_id SERIAL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Upcoming'
);

CREATE TABLE organization.enrollments (
    enrollment_id SERIAL,
    training_id INT NOT NULL,
    employee_id BIGINT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    completion_status VARCHAR(50) DEFAULT 'Enrolled'
);

CREATE TABLE organization.mentorships (
    mentorship_id SERIAL,
    mentor_id BIGINT NOT NULL,
    mentee_id BIGINT NOT NULL,
    start_date DATE,
    end_date DATE,
    focus_area VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE organization.knowledge_sessions (
    session_id SERIAL,
    title VARCHAR(255) NOT NULL,
    speaker_id BIGINT NOT NULL,
    session_date TIMESTAMP,
    topic VARCHAR(255),
    recording_url VARCHAR(255)
);

CREATE TABLE organization.assessments (
    assessment_id SERIAL,
    employee_id BIGINT NOT NULL,
    assessment_type VARCHAR(100) NOT NULL,
    skill_id BIGINT NOT NULL,
    score INT CHECK (score BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization.notifications (
    notification_id SERIAL,
    employee_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization.reports (
    report_id SERIAL,
    report_name VARCHAR(255) NOT NULL,
    generated_by BIGINT NOT NULL,
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_url VARCHAR(255)
);