SET search_path TO organization;

-- ==========================================
-- Roles
-- ==========================================

INSERT INTO roles (role_name)
VALUES
('Admin'),
('Manager'),
('Employee');

-- ==========================================
-- Departments
-- ==========================================

INSERT INTO departments (department_name)
VALUES
('IT'),
('HR'),
('Finance'),
('Sales'),
('Support');

-- ==========================================
-- Users
-- ==========================================

INSERT INTO organization.users (username, email, password, role_id)
VALUES
('emp01','emp01@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp02','emp02@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp03','emp03@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp04','emp04@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp05','emp05@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp06','emp06@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp07','emp07@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp08','emp08@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp09','emp09@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp10','emp10@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp11','emp11@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp12','emp12@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp13','emp13@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp14','emp14@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp15','emp15@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp16','emp16@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp17','emp17@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp18','emp18@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp19','emp19@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3),
('emp20','emp20@gmail.com','$2a$10$NYi/dUpSUNF7PJ/C8etAg..C0niWrtKSIbWqWD44jQco6Fq6XQGFi',3);

-- ==========================================
-- Employees
-- ==========================================

INSERT INTO employees
(user_id, department_id, salary, joining_date)
VALUES
(1,1,85000,'2023-01-10'),
(2,2,60000,'2023-02-15'),
(3,3,70000,'2023-03-20'),
(4,4,55000,'2023-04-11'),
(5,5,50000,'2023-05-08'),
(6,1,90000,'2023-06-12'),
(7,2,62000,'2023-07-18'),
(8,3,71000,'2023-08-22'),
(9,4,56000,'2023-09-05'),
(10,5,51000,'2023-10-15'),
(11,1,88000,'2024-01-05'),
(12,2,64000,'2024-02-11'),
(13,3,72000,'2024-03-14'),
(14,4,57000,'2024-04-09'),
(15,5,52000,'2024-05-20'),
(16,1,92000,'2024-06-18'),
(17,2,65000,'2024-07-07'),
(18,3,73000,'2024-08-13'),
(19,4,58000,'2024-09-01'),
(20,5,53000,'2024-10-25');
-- ==========================================
-- Skills (50 Skills)
-- ==========================================

INSERT INTO skills (skill_name, category)
VALUES
('Java', 'Programming'),
('Python', 'Programming'),
('C Programming', 'Programming'),
('C++', 'Programming'),
('JavaScript', 'Programming'),
('TypeScript', 'Programming'),
('Data Structures', 'Programming'),
('Algorithms', 'Programming'),

('HTML', 'Web Development'),
('CSS', 'Web Development'),
('React.js', 'Web Development'),
('Node.js', 'Web Development'),
('Express.js', 'Web Development'),
('REST API Development', 'Web Development'),

('React Native', 'Mobile Development'),
('Android Development', 'Mobile Development'),
('Flutter', 'Mobile Development'),

('SQL', 'Database'),
('PostgreSQL', 'Database'),
('MySQL', 'Database'),
('Database Design', 'Database'),
('Database Management', 'Database'),

('AWS', 'Cloud'),
('Azure', 'Cloud'),
('Docker', 'DevOps'),
('Git', 'DevOps'),
('GitHub', 'DevOps'),
('CI/CD', 'DevOps'),

('Machine Learning', 'AI'),
('Artificial Intelligence', 'AI'),
('Data Analysis', 'Data'),
('Data Visualization', 'Data'),
('Statistics', 'Data'),

('Cyber Security', 'Security'),
('Network Security', 'Security'),
('Authentication', 'Security'),

('Software Testing', 'Testing'),
('Unit Testing', 'Testing'),
('Debugging', 'Testing'),

('Object Oriented Programming', 'Software Engineering'),
('System Design', 'Software Engineering'),
('Software Architecture', 'Software Engineering'),

('Communication Skills', 'Soft Skills'),
('Leadership', 'Soft Skills'),
('Teamwork', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Time Management', 'Soft Skills'),
('Project Management', 'Management'),
('Agile Methodology', 'Management'),

('Excel', 'Productivity');
-- ==========================================
-- Employee Skills
-- ==========================================

INSERT INTO employee_skills
(employee_id, skill_id, skill_level)
VALUES

-- Employee 1
(1,1,5),
(1,18,4),
(1,26,5),
(1,41,4),
(1,43,5),

-- Employee 2
(2,5,5),
(2,9,5),
(2,10,5),
(2,11,4),
(2,26,4),

-- Employee 3
(3,2,5),
(3,29,4),
(3,30,4),
(3,31,3),
(3,33,3),

-- Employee 4
(4,3,5),
(4,4,5),
(4,7,5),
(4,8,5),
(4,40,4),

-- Employee 5
(5,15,5),
(5,5,4),
(5,18,4),
(5,26,4),
(5,43,5),

-- Employee 6
(6,19,5),
(6,21,4),
(6,22,4),
(6,26,5),
(6,40,4),

-- Employee 7
(7,9,5),
(7,10,5),
(7,11,5),
(7,12,4),
(7,26,5),

-- Employee 8
(8,12,5),
(8,13,5),
(8,14,4),
(8,18,5),
(8,40,4),

-- Employee 9
(9,23,5),
(9,25,4),
(9,26,5),
(9,27,4),
(9,28,3),

-- Employee 10
(10,29,5),
(10,30,5),
(10,31,4),
(10,32,4),
(10,33,3),

-- Employee 11
(11,1,4),
(11,18,4),
(11,21,4),
(11,26,4),
(11,41,4),

-- Employee 12
(12,5,4),
(12,11,4),
(12,14,4),
(12,26,4),
(12,48,5),

-- Employee 13
(13,2,4),
(13,29,3),
(13,30,3),
(13,31,3),
(13,33,3),

-- Employee 14
(14,15,4),
(14,16,4),
(14,18,4),
(14,26,4),
(14,43,5),

-- Employee 15
(15,3,4),
(15,7,4),
(15,8,4),
(15,40,4),
(15,46,5),

-- Employee 16
(16,19,5),
(16,20,5),
(16,21,5),
(16,22,5),
(16,26,5),

-- Employee 17
(17,34,4),
(17,35,4),
(17,36,4),
(17,43,5),
(17,45,4),

-- Employee 18
(18,43,5),
(18,44,5),
(18,45,5),
(18,46,4),
(18,47,4),

-- Employee 19
(19,41,4),
(19,42,4),
(19,48,4),
(19,49,4),
(19,50,4),

-- Employee 20
(20,5,4),
(20,11,4),
(20,18,4),
(20,26,4),
(20,43,5);
-- ==========================================
-- Department Competencies
-- ==========================================

INSERT INTO department_competencies
(department_id, competency_name, required_level)
VALUES

-- IT Department
(1, 'Java', 5),
(1, 'SQL', 4),
(1, 'Git', 4),
(1, 'System Design', 4),

-- HR Department
(2, 'Communication Skills', 5),
(2, 'Leadership', 4),
(2, 'Teamwork', 5),
(2, 'Time Management', 4),

-- Finance Department
(3, 'Excel', 5),
(3, 'SQL', 4),
(3, 'Data Analysis', 5),
(3, 'Statistics', 4),

-- Sales Department
(4, 'Communication Skills', 5),
(4, 'Leadership', 4),
(4, 'Project Management', 4),
(4, 'Problem Solving', 4),

-- Support Department
(5, 'Problem Solving', 5),
(5, 'Communication Skills', 4),
(5, 'Teamwork', 4),
(5, 'Time Management', 4);
-- ==========================================
-- Gap Analysis
-- ==========================================

INSERT INTO gap_analysis
(employee_id, skill_id, current_level, required_level, status)
VALUES
(1,18,4,5,'Open'),
(2,11,4,5,'Open'),
(3,29,4,5,'Open'),
(4,40,4,5,'Open'),
(5,15,3,5,'Open'),
(6,21,4,5,'Open'),
(7,12,4,5,'Open'),
(8,14,4,5,'Open'),
(9,27,3,5,'Open'),
(10,31,4,5,'Open'),
(11,41,4,5,'Open'),
(12,48,4,5,'Open'),
(13,30,3,5,'Open'),
(14,16,4,5,'Open'),
(15,46,4,5,'Open'),
(16,22,4,5,'Open'),
(17,35,4,5,'Open'),
(18,47,4,5,'Open'),
(19,42,4,5,'Open'),
(20,26,4,5,'Open');
-- ==========================================
-- Training Recommendations
-- ==========================================

INSERT INTO training_recommendations
(gap_id, training_name, provider, duration, status)
VALUES
(1,'Advanced PostgreSQL','Udemy','4 Weeks','Recommended'),
(2,'React.js Masterclass','Coursera','6 Weeks','Recommended'),
(3,'Machine Learning Basics','Coursera','8 Weeks','Recommended'),
(4,'System Design Fundamentals','Udemy','5 Weeks','Recommended'),
(5,'React Native Bootcamp','Udemy','6 Weeks','Recommended'),
(6,'Database Optimization','Oracle Academy','4 Weeks','Recommended'),
(7,'Node.js Advanced','Coursera','5 Weeks','Recommended'),
(8,'REST API Development','Udemy','3 Weeks','Recommended'),
(9,'AWS Cloud Practitioner','AWS Academy','6 Weeks','Recommended'),
(10,'Data Analytics with Python','Coursera','5 Weeks','Recommended'),
(11,'Software Architecture','Udemy','6 Weeks','Recommended'),
(12,'Agile Project Management','Google','4 Weeks','Recommended'),
(13,'Artificial Intelligence Fundamentals','Coursera','8 Weeks','Recommended'),
(14,'Android Development','Udemy','6 Weeks','Recommended'),
(15,'Leadership Essentials','LinkedIn Learning','3 Weeks','Recommended'),
(16,'Advanced SQL','Oracle Academy','4 Weeks','Recommended'),
(17,'Cyber Security Essentials','Cisco','6 Weeks','Recommended'),
(18,'Professional Communication','LinkedIn Learning','2 Weeks','Recommended'),
(19,'Project Management Basics','Google','5 Weeks','Recommended'),
(20,'Git & GitHub Professional','Udemy','2 Weeks','Recommended');
