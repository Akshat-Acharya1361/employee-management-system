-- Sample data for local development and demos, so the list, filters and
-- pagination are visible on first run. Loaded only while "classpath:db/seed"
-- is part of spring.flyway.locations (see application.yml / README).
INSERT INTO employees (employee_code, full_name, email, phone, department, designation, joining_date, salary, status) VALUES
    ('EMP-001', 'Aarav Sharma',     'aarav.sharma@example.com',     '+91 98260 11001', 'Engineering', 'Software Engineer',        '2022-07-11',  850000.00, 'ACTIVE'),
    ('EMP-002', 'Diya Patel',       'diya.patel@example.com',       '+91 98260 11002', 'Engineering', 'Senior Software Engineer', '2020-03-02', 1650000.00, 'ACTIVE'),
    ('EMP-003', 'Kabir Mehta',      'kabir.mehta@example.com',      '+91 98260 11003', 'Engineering', 'QA Engineer',              '2023-01-16',  720000.00, 'ACTIVE'),
    ('EMP-004', 'Ananya Iyer',      'ananya.iyer@example.com',      '+91 98260 11004', 'Engineering', 'DevOps Engineer',          '2021-09-20', 1200000.00, 'INACTIVE'),
    ('EMP-005', 'Rohan Verma',      'rohan.verma@example.com',      '+91 98260 11005', 'Sales',       'Account Executive',        '2022-11-07',  640000.00, 'ACTIVE'),
    ('EMP-006', 'Ishita Gupta',     'ishita.gupta@example.com',     '+91 98260 11006', 'Sales',       'Sales Manager',            '2019-06-03', 1450000.00, 'ACTIVE'),
    ('EMP-007', 'Vihaan Reddy',     'vihaan.reddy@example.com',     '+91 98260 11007', 'Sales',       'Business Development Rep', '2024-02-12',  520000.00, 'INACTIVE'),
    ('EMP-008', 'Saanvi Nair',      'saanvi.nair@example.com',      '+91 98260 11008', 'Human Resources', 'HR Generalist',        '2021-04-19',  600000.00, 'ACTIVE'),
    ('EMP-009', 'Arjun Singh',      'arjun.singh@example.com',      '+91 98260 11009', 'Human Resources', 'Talent Acquisition Lead', '2020-08-24', 980000.00, 'ACTIVE'),
    ('EMP-010', 'Meera Joshi',      'meera.joshi@example.com',      '+91 98260 11010', 'Finance',     'Financial Analyst',        '2022-05-30',  780000.00, 'ACTIVE'),
    ('EMP-011', 'Aditya Kulkarni',  'aditya.kulkarni@example.com',  '+91 98260 11011', 'Finance',     'Accounts Manager',         '2018-12-10', 1350000.00, 'INACTIVE'),
    ('EMP-012', 'Nisha Rao',        'nisha.rao@example.com',        '+91 98260 11012', 'Marketing',   'Content Strategist',       '2023-07-03',  690000.00, 'ACTIVE'),
    ('EMP-013', 'Karan Malhotra',   'karan.malhotra@example.com',   '+91 98260 11013', 'Marketing',   'Marketing Manager',        '2019-10-14', 1400000.00, 'ACTIVE'),
    ('EMP-014', 'Priya Desai',      'priya.desai@example.com',      '+91 98260 11014', 'Operations',  'Operations Coordinator',   '2024-06-17',  560000.00, 'ACTIVE'),
    ('EMP-015', 'Siddharth Jain',   'siddharth.jain@example.com',   '+91 98260 11015', 'Operations',  'Operations Manager',       '2017-03-27', 1550000.00, 'ACTIVE');
