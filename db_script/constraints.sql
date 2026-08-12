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
REFERENCES employees(id); -- CORRECTED: Now points to the primary key 'id'

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
REFERENCES employees(id); -- CORRECTED: Now points to the primary key 'id'

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

-- ==========================================
-- Goal 2: Primary Keys
-- ==========================================

ALTER TABLE organization.trainings ADD CONSTRAINT pk_trainings PRIMARY KEY (training_id);
ALTER TABLE organization.enrollments ADD CONSTRAINT pk_enrollments PRIMARY KEY (enrollment_id);
ALTER TABLE organization.mentorships ADD CONSTRAINT pk_mentorships PRIMARY KEY (mentorship_id);
ALTER TABLE organization.knowledge_sessions ADD CONSTRAINT pk_knowledge_sessions PRIMARY KEY (session_id);
ALTER TABLE organization.assessments ADD CONSTRAINT pk_assessments PRIMARY KEY (assessment_id);
ALTER TABLE organization.notifications ADD CONSTRAINT pk_notifications PRIMARY KEY (notification_id);
ALTER TABLE organization.reports ADD CONSTRAINT pk_reports PRIMARY KEY (report_id);

-- ==========================================
-- Goal 2: Foreign Keys
-- ==========================================

ALTER TABLE organization.enrollments 
ADD CONSTRAINT fk_enrollments_training FOREIGN KEY (training_id) REFERENCES organization.trainings(training_id),
ADD CONSTRAINT fk_enrollments_employee FOREIGN KEY (employee_id) REFERENCES organization.employees(id);

ALTER TABLE organization.mentorships 
ADD CONSTRAINT fk_mentorships_mentor FOREIGN KEY (mentor_id) REFERENCES organization.employees(id),
ADD CONSTRAINT fk_mentorships_mentee FOREIGN KEY (mentee_id) REFERENCES organization.employees(id);

ALTER TABLE organization.knowledge_sessions 
ADD CONSTRAINT fk_sessions_speaker FOREIGN KEY (speaker_id) REFERENCES organization.employees(id);

ALTER TABLE organization.assessments 
ADD CONSTRAINT fk_assessments_employee FOREIGN KEY (employee_id) REFERENCES organization.employees(id),
ADD CONSTRAINT fk_assessments_skill FOREIGN KEY (skill_id) REFERENCES organization.skills(skill_id);

ALTER TABLE organization.notifications 
ADD CONSTRAINT fk_notifications_employee FOREIGN KEY (employee_id) REFERENCES organization.employees(id);

ALTER TABLE organization.reports 
ADD CONSTRAINT fk_reports_employee FOREIGN KEY (generated_by) REFERENCES organization.employees(id);

-- ==========================================
-- Goal 2: Unique Constraints & Indexes
-- ==========================================

ALTER TABLE organization.enrollments ADD CONSTRAINT uq_training_employee UNIQUE (training_id, employee_id);

CREATE INDEX idx_enrollments_employee ON organization.enrollments(employee_id);
CREATE INDEX idx_mentorships_mentee ON organization.mentorships(mentee_id);
CREATE INDEX idx_assessments_employee ON organization.assessments(employee_id);
CREATE INDEX idx_notifications_employee ON organization.notifications(employee_id);