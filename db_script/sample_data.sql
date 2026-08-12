SET search_path TO organization;

-- ==========================================
-- Roles
-- ==========================================

INSERT INTO roles (role_id, role_name, description)
VALUES
(1, 'ROLE_ADMIN', 'Administrator role'),
(2, 'ROLE_MANAGER', 'Manager role'),
(3, 'ROLE_EMPLOYEE', 'Employee role');

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

-- Seeded password for all users below is 1234 (Backend auto-migrates to BCrypt)
INSERT INTO organization.users (username, email, password, role_id)
VALUES
('emp01','emp01@gmail.com','1234',3),
('emp02','emp02@gmail.com','1234',3),
('emp03','emp03@gmail.com','1234',3),
('emp04','emp04@gmail.com','1234',3),
('emp05','emp05@gmail.com','1234',3),
('emp06','emp06@gmail.com','1234',3),
('emp07','emp07@gmail.com','1234',3),
('emp08','emp08@gmail.com','1234',3),
('emp09','emp09@gmail.com','1234',3),
('emp10','emp10@gmail.com','1234',3),
('emp11','emp11@gmail.com','1234',3),
('emp12','emp12@gmail.com','1234',3),
('emp13','emp13@gmail.com','1234',3),
('emp14','emp14@gmail.com','1234',3),
('emp15','emp15@gmail.com','1234',3),
('emp16','emp16@gmail.com','1234',3),
('emp17','emp17@gmail.com','1234',3),
('emp18','emp18@gmail.com','1234',3),
('emp19','emp19@gmail.com','1234',3),
('emp20','emp20@gmail.com','1234',3);

-- ==========================================
-- Employees
-- ==========================================

INSERT INTO employees
(id, employee_id, user_id, department_id, salary, joining_date, phone, employee_code, name, email, designation)
VALUES
(1, 101, 1, 1, 85000, '2023-01-10', '1234567890', 'EMP-1', 'Alice Smith', 'emp01@gmail.com', 'Frontend Developer'),
(2, 102, 2, 2, 60000, '2023-02-15', '0987654321', 'EMP-2', 'Bob Jones', 'emp02@gmail.com', 'Backend Developer'),
(3, 103, 3, 3, 70000, '2023-03-20', '1122334455', 'EMP-3', 'Charlie Brown', 'emp03@gmail.com', 'Financial Analyst'),
(4, 104, 4, 4, 55000, '2023-04-11', '2233445566', 'EMP-4', 'Diana Prince', 'emp04@gmail.com', 'Sales Rep'),
(5, 105, 5, 5, 50000, '2023-05-08', '3344556677', 'EMP-5', 'Evan Wright', 'emp05@gmail.com', 'Support Specialist'),
(6, 106, 6, 1, 90000, '2023-06-12', '4455667788', 'EMP-6', 'Fiona Gallagher', 'emp06@gmail.com', 'Senior Developer'),
(7, 107, 7, 2, 62000, '2023-07-18', '5566778899', 'EMP-7', 'George Costanza', 'emp07@gmail.com', 'HR Generalist'),
(8, 108, 8, 3, 71000, '2023-08-22', '6677889900', 'EMP-8', 'Hannah Abbott', 'emp08@gmail.com', 'Accountant'),
(9, 109, 9, 4, 56000, '2023-09-05', '7788990011', 'EMP-9', 'Ian Malcolm', 'emp09@gmail.com', 'Sales Manager'),
(10, 110, 10, 5, 51000, '2023-10-15', '8899001122', 'EMP-10', 'Julia Roberts', 'emp10@gmail.com', 'Tech Support'),
(11, 111, 11, 1, 88000, '2024-01-05', '9900112233', 'EMP-11', 'Kevin Space', 'emp11@gmail.com', 'DevOps Engineer'),
(12, 112, 12, 2, 64000, '2024-02-11', '0011223344', 'EMP-12', 'Laura Palmer', 'emp12@gmail.com', 'Recruiter'),
(13, 113, 13, 3, 72000, '2024-03-14', '1212121212', 'EMP-13', 'Michael Scott', 'emp13@gmail.com', 'Finance Director'),
(14, 114, 14, 4, 57000, '2024-04-09', '2323232323', 'EMP-14', 'Nina Simone', 'emp14@gmail.com', 'Sales Associate'),
(15, 115, 15, 5, 52000, '2024-05-20', '3434343434', 'EMP-15', 'Oscar Martinez', 'emp15@gmail.com', 'Customer Success'),
(16, 116, 16, 1, 92000, '2024-06-18', '4545454545', 'EMP-16', 'Pam Beesly', 'emp16@gmail.com', 'UI/UX Designer'),
(17, 117, 17, 2, 65000, '2024-07-07', '5656565656', 'EMP-17', 'Quinn Fabray', 'emp17@gmail.com', 'HR Manager'),
(18, 118, 18, 3, 73000, '2024-08-13', '6767676767', 'EMP-18', 'Ryan Howard', 'emp18@gmail.com', 'Payroll Specialist'),
(19, 119, 19, 4, 58000, '2024-09-01', '7878787878', 'EMP-19', 'Stanley Hudson', 'emp19@gmail.com', 'Account Executive'),
(20, 120, 20, 5, 53000, '2024-10-25', '8989898989', 'EMP-20', 'Toby Flenderson', 'emp20@gmail.com', 'Support Lead');

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
(id, employee_skill_id, employee_id, skill_id, level)
VALUES
(1, 1, 1, 1, 5),
(2, 2, 1, 18, 4),
(3, 3, 1, 26, 5),
(4, 4, 1, 41, 4),
(5, 5, 1, 43, 5),
(6, 6, 2, 5, 5),
(7, 7, 2, 9, 5),
(8, 8, 2, 10, 5),
(9, 9, 2, 11, 4),
(10, 10, 2, 26, 4),
(11, 11, 3, 2, 5),
(12, 12, 3, 29, 4),
(13, 13, 3, 30, 4),
(14, 14, 3, 31, 3),
(15, 15, 3, 33, 3),
(16, 16, 4, 3, 5),
(17, 17, 4, 4, 5),
(18, 18, 4, 7, 5),
(19, 19, 4, 8, 5),
(20, 20, 4, 40, 4),
(21, 21, 5, 15, 5),
(22, 22, 5, 5, 4),
(23, 23, 5, 18, 4),
(24, 24, 5, 26, 4),
(25, 25, 5, 43, 5),
(26, 26, 6, 19, 5),
(27, 27, 6, 21, 4),
(28, 28, 6, 22, 4),
(29, 29, 6, 26, 5),
(30, 30, 6, 40, 4),
(31, 31, 7, 9, 5),
(32, 32, 7, 10, 5),
(33, 33, 7, 11, 5),
(34, 34, 7, 12, 4),
(35, 35, 7, 26, 5),
(36, 36, 8, 12, 5),
(37, 37, 8, 13, 5),
(38, 38, 8, 14, 4),
(39, 39, 8, 18, 5),
(40, 40, 8, 40, 4),
(41, 41, 9, 23, 5),
(42, 42, 9, 25, 4),
(43, 43, 9, 26, 5),
(44, 44, 9, 27, 4),
(45, 45, 9, 28, 3),
(46, 46, 10, 29, 5),
(47, 47, 10, 30, 5),
(48, 48, 10, 31, 4),
(49, 49, 10, 32, 4),
(50, 50, 10, 33, 3),
(51, 51, 11, 1, 4),
(52, 52, 11, 18, 4),
(53, 53, 11, 21, 4),
(54, 54, 11, 26, 4),
(55, 55, 11, 41, 4),
(56, 56, 12, 5, 4),
(57, 57, 12, 11, 4),
(58, 58, 12, 14, 4),
(59, 59, 12, 26, 4),
(60, 60, 12, 48, 5),
(61, 61, 13, 2, 4),
(62, 62, 13, 29, 3),
(63, 63, 13, 30, 3),
(64, 64, 13, 31, 3),
(65, 65, 13, 33, 3),
(66, 66, 14, 15, 4),
(67, 67, 14, 16, 4),
(68, 68, 14, 18, 4),
(69, 69, 14, 26, 4),
(70, 70, 14, 43, 5),
(71, 71, 15, 3, 4),
(72, 72, 15, 7, 4),
(73, 73, 15, 8, 4),
(74, 74, 15, 40, 4),
(75, 75, 15, 46, 5),
(76, 76, 16, 19, 5),
(77, 77, 16, 20, 5),
(78, 78, 16, 21, 5),
(79, 79, 16, 22, 5),
(80, 80, 16, 26, 5),
(81, 81, 17, 34, 4),
(82, 82, 17, 35, 4),
(83, 83, 17, 36, 4),
(84, 84, 17, 43, 5),
(85, 85, 17, 45, 4),
(86, 86, 18, 43, 5),
(87, 87, 18, 44, 5),
(88, 88, 18, 45, 5),
(89, 89, 18, 46, 4),
(90, 90, 18, 47, 4),
(91, 91, 19, 41, 4),
(92, 92, 19, 42, 4),
(93, 93, 19, 48, 4),
(94, 94, 19, 49, 4),
(95, 95, 19, 50, 4),
(96, 96, 20, 5, 4),
(97, 97, 20, 11, 4),
(98, 98, 20, 18, 4),
(99, 99, 20, 26, 4),
(100, 100, 20, 43, 5);

-- ==========================================
-- Department Competencies
-- ==========================================

INSERT INTO department_competencies
(department_id, competency_name, required_level)
VALUES
(1, 'Java', 5),
(1, 'SQL', 4),
(1, 'Git', 4),
(1, 'System Design', 4),
(2, 'Communication Skills', 5),
(2, 'Leadership', 4),
(2, 'Teamwork', 5),
(2, 'Time Management', 4),
(3, 'Excel', 5),
(3, 'SQL', 4),
(3, 'Data Analysis', 5),
(3, 'Statistics', 4),
(4, 'Communication Skills', 5),
(4, 'Leadership', 4),
(4, 'Project Management', 4),
(4, 'Problem Solving', 4),
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
(101,18,4,5,'Open'),
(102,11,4,5,'Open'),
(103,29,4,5,'Open'),
(104,40,4,5,'Open'),
(105,15,3,5,'Open'),
(106,21,4,5,'Open'),
(107,12,4,5,'Open'),
(108,14,4,5,'Open'),
(109,27,3,5,'Open'),
(110,31,4,5,'Open'),
(111,41,4,5,'Open'),
(112,48,4,5,'Open'),
(113,30,3,5,'Open'),
(114,16,4,5,'Open'),
(115,46,4,5,'Open'),
(116,22,4,5,'Open'),
(117,35,4,5,'Open'),
(118,47,4,5,'Open'),
(119,42,4,5,'Open'),
(120,26,4,5,'Open');

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