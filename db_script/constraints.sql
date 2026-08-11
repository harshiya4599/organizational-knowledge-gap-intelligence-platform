SET search_path TO organization;

-- ==========================================
-- PRIMARY KEYS
-- ==========================================

ALTER TABLE roles
ADD CONSTRAINT pk_roles
PRIMARY KEY (role_id);

ALTER TABLE users
ADD CONSTRAINT pk_users
PRIMARY KEY (user_id);

ALTER TABLE departments
ADD CONSTRAINT pk_departments
PRIMARY KEY (department_id);

ALTER TABLE skills
ADD CONSTRAINT pk_skills
PRIMARY KEY (skill_id);

ALTER TABLE department_competencies
ADD CONSTRAINT pk_department_competencies
PRIMARY KEY (competency_id);

ALTER TABLE gap_analysis
ADD CONSTRAINT pk_gap_analysis
PRIMARY KEY (gap_id);

ALTER TABLE training_recommendations
ADD CONSTRAINT pk_training_recommendations
PRIMARY KEY (recommendation_id);

-- ==========================================
-- UNIQUE CONSTRAINTS
-- ==========================================

ALTER TABLE roles
ADD CONSTRAINT uq_role_name
UNIQUE (role_name);

ALTER TABLE users
ADD CONSTRAINT uq_users_email
UNIQUE (email);

ALTER TABLE departments
ADD CONSTRAINT uq_department_name
UNIQUE (department_name);

ALTER TABLE skills
ADD CONSTRAINT uq_skill_name
UNIQUE (skill_name);

ALTER TABLE employee_skills
ADD CONSTRAINT uq_employee_skill
UNIQUE (employee_id, skill_id);

ALTER TABLE employees
ADD CONSTRAINT uq_employee_id_legacy
UNIQUE (employee_id);

-- ==========================================
-- FOREIGN KEYS
-- ==========================================

ALTER TABLE users
ADD CONSTRAINT fk_users_role
FOREIGN KEY (role_id)
REFERENCES roles(role_id);

ALTER TABLE employees
ADD CONSTRAINT fk_employee_user
FOREIGN KEY (user_id)
REFERENCES users(user_id);

ALTER TABLE employees
ADD CONSTRAINT fk_employee_department
FOREIGN KEY (department_id)
REFERENCES departments(department_id);

ALTER TABLE employee_skills
ADD CONSTRAINT fk_employee_skills_employee
FOREIGN KEY (employee_id)
REFERENCES employees(employee_id);

ALTER TABLE employee_skills
ADD CONSTRAINT fk_employee_skills_skill
FOREIGN KEY (skill_id)
REFERENCES skills(skill_id);

ALTER TABLE department_competencies
ADD CONSTRAINT fk_department_competencies_department
FOREIGN KEY (department_id)
REFERENCES departments(department_id);

ALTER TABLE gap_analysis
ADD CONSTRAINT fk_gap_employee
FOREIGN KEY (employee_id)
REFERENCES employees(employee_id);

ALTER TABLE gap_analysis
ADD CONSTRAINT fk_gap_skill
FOREIGN KEY (skill_id)
REFERENCES skills(skill_id);

ALTER TABLE training_recommendations
ADD CONSTRAINT fk_training_gap
FOREIGN KEY (gap_id)
REFERENCES gap_analysis(gap_id);

-- ==========================================
-- NEW ENTITY CONSTRAINTS
-- ==========================================
ALTER TABLE organization.employees ALTER COLUMN employee_code SET NOT NULL;
ALTER TABLE organization.employees ADD CONSTRAINT uq_employee_code UNIQUE (employee_code);

ALTER TABLE organization.employees ALTER COLUMN name SET NOT NULL;

ALTER TABLE organization.employees ALTER COLUMN email SET NOT NULL;
ALTER TABLE organization.employees ADD CONSTRAINT uq_employee_email UNIQUE (email);

ALTER TABLE organization.employees ALTER COLUMN designation SET NOT NULL;

ALTER TABLE organization.employee_skills ADD CONSTRAINT chk_level CHECK (level >= 1 AND level <= 5);