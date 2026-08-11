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