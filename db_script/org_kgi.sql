--
-- PostgreSQL database dump
--

\restrict xFitD7AcbyNSbdO7UlhtIONAe1uv1eDL7zkPqoBorqUvtuo2Y2tpfXCphbvLuqe

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-11 16:16:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16389)
-- Name: organization; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA organization;
ALTER SCHEMA organization OWNER TO postgres;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.departments (
    department_id integer NOT NULL,
    department_name character varying(100)
);
ALTER TABLE organization.departments OWNER TO postgres;

CREATE SEQUENCE organization.departments_department_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.departments_department_id_seq OWNER TO postgres;
ALTER SEQUENCE organization.departments_department_id_seq OWNED BY organization.departments.department_id;

--
-- Name: employees; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.employees (
    employee_id integer NOT NULL,
    user_id integer,
    department_id integer,
    salary numeric(10,2),
    joining_date date,
    employee_code character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    designation character varying(255) NOT NULL
);
ALTER TABLE organization.employees OWNER TO postgres;

CREATE SEQUENCE organization.employees_employee_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.employees_employee_id_seq OWNER TO postgres;
ALTER SEQUENCE organization.employees_employee_id_seq OWNED BY organization.employees.employee_id;

--
-- Name: roles; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.roles (
    role_id integer NOT NULL,
    role_name character varying(50)
);
ALTER TABLE organization.roles OWNER TO postgres;

CREATE SEQUENCE organization.roles_role_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.roles_role_id_seq OWNER TO postgres;
ALTER SEQUENCE organization.roles_role_id_seq OWNED BY organization.roles.role_id;

--
-- Name: users; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.users (
    user_id integer NOT NULL,
    username character varying(50),
    email character varying(100),
    role_id integer
);
ALTER TABLE organization.users OWNER TO postgres;

CREATE SEQUENCE organization.users_user_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.users_user_id_seq OWNER TO postgres;
ALTER SEQUENCE organization.users_user_id_seq OWNED BY organization.users.user_id;

--
-- Name: skills; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.skills (
    skill_id integer NOT NULL,
    skill_name character varying(255),
    description text,
    category character varying(255)
);
ALTER TABLE organization.skills OWNER TO postgres;

CREATE SEQUENCE organization.skills_skill_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.skills_skill_id_seq OWNER TO postgres;
ALTER SEQUENCE organization.skills_skill_id_seq OWNED BY organization.skills.skill_id;

--
-- Name: employee_skills; Type: TABLE; Schema: organization; Owner: postgres
--

CREATE TABLE organization.employee_skills (
    employee_skill_id integer NOT NULL,
    employee_id integer NOT NULL,
    skill_id integer NOT NULL,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5)
);
ALTER TABLE organization.employee_skills OWNER TO postgres;

CREATE SEQUENCE organization.employee_skills_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE organization.employee_skills_seq OWNER TO postgres;
ALTER SEQUENCE organization.employee_skills_seq OWNED BY organization.employee_skills.employee_skill_id;

--
-- Public Schema Tables (Retained exactly as provided)
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(100) NOT NULL
);
ALTER TABLE public.departments OWNER TO postgres;

CREATE SEQUENCE public.departments_department_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;
ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;

CREATE TABLE public.employee_roles (
    employee_id integer NOT NULL,
    role_id integer NOT NULL
);
ALTER TABLE public.employee_roles OWNER TO postgres;

CREATE TABLE public.employees (
    employee_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone_number character varying(15),
    hire_date date NOT NULL,
    salary numeric(10,2),
    department_id integer
);
ALTER TABLE public.employees OWNER TO postgres;

CREATE SEQUENCE public.employees_employee_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.employees_employee_id_seq OWNER TO postgres;
ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(100) NOT NULL
);
ALTER TABLE public.roles OWNER TO postgres;

CREATE SEQUENCE public.roles_role_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;
ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    employee_id integer
);
ALTER TABLE public.users OWNER TO postgres;

CREATE SEQUENCE public.users_user_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;
ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;

--
-- Default Values
--

ALTER TABLE ONLY organization.departments ALTER COLUMN department_id SET DEFAULT nextval('organization.departments_department_id_seq'::regclass);
ALTER TABLE ONLY organization.employees ALTER COLUMN employee_id SET DEFAULT nextval('organization.employees_employee_id_seq'::regclass);
ALTER TABLE ONLY organization.roles ALTER COLUMN role_id SET DEFAULT nextval('organization.roles_role_id_seq'::regclass);
ALTER TABLE ONLY organization.users ALTER COLUMN user_id SET DEFAULT nextval('organization.users_user_id_seq'::regclass);
ALTER TABLE ONLY organization.skills ALTER COLUMN skill_id SET DEFAULT nextval('organization.skills_skill_id_seq'::regclass);
ALTER TABLE ONLY organization.employee_skills ALTER COLUMN employee_skill_id SET DEFAULT nextval('organization.employee_skills_seq'::regclass);

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);
ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);
ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);

--
-- Data Copy Blocks
--

COPY organization.departments (department_id, department_name) FROM stdin;
1	HR
2	IT
3	Finance
\.

COPY organization.employees (employee_id, user_id, department_id, salary, joining_date, employee_code, name, email, designation) FROM stdin;
1	1	2	80000.00	2025-01-10	EMP-1	Alice Smith	alice@gmail.com	Frontend Developer
2	2	1	60000.00	2024-08-15	EMP-2	Bob Jones	bob@gmail.com	Backend Developer
3	3	3	50000.00	2023-03-12	EMP-3	Charlie Brown	charlie@gmail.com	Database Developer
\.

COPY organization.roles (role_id, role_name) FROM stdin;
1	ROLE_ADMIN
2	ROLE_MANAGER
3	ROLE_EMPLOYEE
\.

COPY organization.users (user_id, username, email, role_id) FROM stdin;
1	Alice	alice@gmail.com	1
2	Bob	bob@gmail.com	2
3	Charlie	charlie@gmail.com	3
\.

COPY organization.skills (skill_id, skill_name, description, category) FROM stdin;
1	Java	Backend framework logic	Technical
2	React	Frontend UI building	Technical
3	PostgreSQL	Database management	Technical
\.

COPY organization.employee_skills (employee_skill_id, employee_id, skill_id, level) FROM stdin;
1	1	2	4
2	2	1	5
3	3	3	4
\.

COPY public.departments (department_id, department_name) FROM stdin;
1	IT
2	HR
3	Finance
4	Sales
5	Support
\.

COPY public.employee_roles (employee_id, role_id) FROM stdin;
1	3
2	4
3	2
4	2
5	5
6	3
7	2
8	4
9	2
10	5
11	1
12	2
13	5
14	4
15	2
16	3
17	2
18	4
19	5
20	3
\.

COPY public.employees (employee_id, first_name, last_name, email, phone_number, hire_date, salary, department_id) FROM stdin;
1	Arun	Kumar	arun.kumar@technova.com	9876543210	2023-01-15	65000.00	1
2	Priya	Sharma	priya.sharma@technova.com	9876543211	2023-02-10	55000.00	2
3	Rahul	Verma	rahul.verma@technova.com	9876543212	2023-03-05	70000.00	3
4	Sneha	Iyer	sneha.iyer@technova.com	9876543213	2023-01-20	60000.00	4
5	Karthik	Raj	karthik.raj@technova.com	9876543214	2023-04-12	50000.00	5
6	Aishwarya	Nair	aishwarya.nair@technova.com	9876543215	2023-02-18	68000.00	1
7	Vikram	Singh	vikram.singh@technova.com	9876543216	2023-05-01	72000.00	3
8	Neha	Gupta	neha.gupta@technova.com	9876543217	2023-03-25	56000.00	2
9	Rohan	Patel	rohan.patel@technova.com	9876543218	2023-06-08	59000.00	4
10	Meera	Krishnan	meera.krishnan@technova.com	9876543219	2023-04-15	52000.00	5
11	Sanjay	Reddy	sanjay.reddy@technova.com	9876543220	2023-07-01	75000.00	1
12	Divya	Menon	divya.menon@technova.com	9876543221	2023-05-18	71000.00	3
13	Ajay	Kumar	ajay.kumar@technova.com	9876543222	2023-08-10	51000.00	5
14	Pooja	Das	pooja.das@technova.com	9876543223	2023-06-20	57000.00	2
15	Harish	Babu	harish.babu@technova.com	9876543224	2023-09-05	61000.00	4
16	Nisha	Kapoor	nisha.kapoor@technova.com	9876543225	2023-07-22	69000.00	1
17	Manoj	Kumar	manoj.kumar@technova.com	9876543226	2023-10-01	73000.00	3
18	Keerthana	S	keerthana.s@technova.com	9876543227	2023-08-14	58000.00	2
19	Akash	Jain	akash.jain@technova.com	9876543228	2023-11-12	53000.00	5
20	Ananya	Rao	ananya.rao@technova.com	9876543229	2023-09-28	70000.00	1
\.

COPY public.roles (role_id, role_name) FROM stdin;
1	Admin
2	Manager
3	Developer
4	HR
5	Tester
6	System Administrator
7	Project Manager
8	Software Developer
9	HR Executive
10	QA Engineer
\.

COPY public.users (user_id, username, password, employee_id) FROM stdin;
1	arun.kumar	Arun@123	1
2	priya.sharma	Priya@123	2
3	rahul.verma	Rahul@123	3
4	sneha.iyer	Sneha@123	4
5	karthik.raj	Karthik@123	5
6	aishwarya.nair	Aishwarya@123	6
7	vikram.singh	Vikram@123	7
8	neha.gupta	Neha@123	8
9	rohan.patel	Rohan@123	9
10	meera.krishnan	Meera@123	10
11	sanjay.reddy	Sanjay@123	11
12	divya.menon	Divya@123	12
13	ajay.kumar	Ajay@123	13
14	pooja.das	Pooja@123	14
15	harish.babu	Harish@123	15
16	nisha.kapoor	Nisha@123	16
17	manoj.kumar	Manoj@123	17
18	keerthana.s	Keerthana@123	18
19	akash.jain	Akash@123	19
20	ananya.rao	Ananya@123	20
\.

--
-- Sequence Sets
--

SELECT pg_catalog.setval('organization.departments_department_id_seq', 3, true);
SELECT pg_catalog.setval('organization.employees_employee_id_seq', 3, true);
SELECT pg_catalog.setval('organization.roles_role_id_seq', 3, true);
SELECT pg_catalog.setval('organization.users_user_id_seq', 3, true);
SELECT pg_catalog.setval('organization.skills_skill_id_seq', 3, true);
SELECT pg_catalog.setval('organization.employee_skills_seq', 3, true);

SELECT pg_catalog.setval('public.departments_department_id_seq', 5, true);
SELECT pg_catalog.setval('public.employees_employee_id_seq', 20, true);
SELECT pg_catalog.setval('public.roles_role_id_seq', 10, true);
SELECT pg_catalog.setval('public.users_user_id_seq', 20, true);

--
-- Constraints (Primary Keys & Unique)
--

ALTER TABLE ONLY organization.departments ADD CONSTRAINT pk_departments PRIMARY KEY (department_id);
ALTER TABLE ONLY organization.employees ADD CONSTRAINT pk_employees PRIMARY KEY (employee_id);
ALTER TABLE ONLY organization.roles ADD CONSTRAINT pk_roles PRIMARY KEY (role_id);
ALTER TABLE ONLY organization.users ADD CONSTRAINT pk_users PRIMARY KEY (user_id);
ALTER TABLE ONLY organization.skills ADD CONSTRAINT pk_skills PRIMARY KEY (skill_id);
ALTER TABLE ONLY organization.employee_skills ADD CONSTRAINT pk_employee_skills PRIMARY KEY (employee_skill_id);

ALTER TABLE ONLY organization.departments ADD CONSTRAINT uq_department_name UNIQUE (department_name);
ALTER TABLE ONLY organization.roles ADD CONSTRAINT uq_role_name UNIQUE (role_name);
ALTER TABLE ONLY organization.users ADD CONSTRAINT uq_users_email UNIQUE (email);
ALTER TABLE ONLY organization.employees ADD CONSTRAINT uq_employee_code UNIQUE (employee_code);
ALTER TABLE ONLY organization.employees ADD CONSTRAINT uq_employee_email UNIQUE (email);

ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);
ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);
ALTER TABLE ONLY public.employee_roles ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (employee_id, role_id);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_email_key UNIQUE (email);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);

--
-- Indexes
--

CREATE INDEX idx_employees_department ON organization.employees USING btree (department_id);
CREATE INDEX idx_users_role ON organization.users USING btree (role_id);
CREATE INDEX idx_users_username ON organization.users USING btree (username);

CREATE INDEX idx_employee_department ON public.employees USING btree (department_id);
CREATE INDEX idx_employee_email ON public.employees USING btree (email);
CREATE INDEX idx_employee_roles_role ON public.employee_roles USING btree (role_id);
CREATE INDEX idx_user_username ON public.users USING btree (username);

--
-- Foreign Keys
--

ALTER TABLE ONLY organization.employees ADD CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES organization.departments(department_id);
ALTER TABLE ONLY organization.employees ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES organization.users(user_id);
ALTER TABLE ONLY organization.users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES organization.roles(role_id);
ALTER TABLE ONLY organization.employee_skills ADD CONSTRAINT fk_employee_skills_employee FOREIGN KEY (employee_id) REFERENCES organization.employees(employee_id);
ALTER TABLE ONLY organization.employee_skills ADD CONSTRAINT fk_employee_skills_skill FOREIGN KEY (skill_id) REFERENCES organization.skills(skill_id);

ALTER TABLE ONLY public.employees ADD CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE ONLY public.employee_roles ADD CONSTRAINT fk_employee_role_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
ALTER TABLE ONLY public.employee_roles ADD CONSTRAINT fk_employee_role_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);

--
-- PostgreSQL database dump complete
--

\unrestrict xFitD7AcbyNSbdO7UlhtIONAe1uv1eDL7zkPqoBorqUvtuo2Y2tpfXCphbvLuqe