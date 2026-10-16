# Employee Management System

A full-stack web application for an administrator to manage employee records: add, view, edit and delete
employees, and search, filter, sort and page through the employee list.

Built for the Kloudspot *Software Engineer / Backend (Freshers)* technical assessment.

| Layer     | Technology |
|-----------|------------|
| Backend   | Java 17+, Spring Boot 3.3, Spring Web, Spring Data JPA, Bean Validation, Spring Security, Maven |
| Database  | PostgreSQL 16, schema managed by Flyway migrations |
| API docs  | springdoc-openapi (Swagger UI) |
| Frontend  | React 18 + TypeScript, React Router, Vite |
| Tests     | JUnit 5, Mockito, Spring MockMvc (backend); Vitest + Testing Library (frontend) |

---

## Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Quick start](#quick-start)
4. [Configuration](#configuration)
5. [Running the tests](#running-the-tests)
6. [API reference](#api-reference)
7. [Design decisions](#design-decisions)
8. [Authentication](#authentication)
9. [Assumptions](#assumptions)
10. [Project structure](#project-structure)
11. [Screenshots / demo](#screenshots--demo)
12. [Known limitations](#known-limitations)

---

## Features

**Required scope**

- Employee records with Employee ID, full name, email, phone, department, designation, date of joining,
  salary and employment status (Active / Inactive).
- Create, list, view details, edit, and delete (with a confirmation dialog).
- Search by name or email (case-insensitive, partial match).
- Filter by department and employment status.
- Server-side pagination and sorting; search, filters, sorting and paging all work together.
- Responsive pages: Employee List, Add Employee, Edit Employee, Employee Details.
- Loading, empty, success, validation and error states; double-submit protection; accessible labels and
  keyboard-operable controls.
- REST API with DTOs, consistent JSON errors, and Swagger/OpenAPI docs.
- Service-layer unit tests (JUnit 5 + Mockito).

**Bonus features implemented**

- Login with HTTP Basic authentication: a login page, protected pages and API, logout (see
  [Authentication](#authentication)).
- Export to CSV (respects the current search and filters).
- Docker Compose for PostgreSQL.
- Automated frontend tests (Vitest + Testing Library).

Not implemented: a separate department-management screen (see [Known limitations](#known-limitations)).

---

## Prerequisites

| Tool | Version | Check with |
|------|---------|------------|
| JDK | 17 or newer | `java -version` |
| Maven | 3.9 or newer (or use the included wrapper — no install needed) | `mvn -v` / `./mvnw -v` |
| Node.js | 18 or newer (20+ recommended) | `node -v` |
| PostgreSQL | 14 or newer, **or** Docker with Compose | `psql --version` / `docker compose version` |

> **Maven Wrapper included.** `backend/mvnw` (macOS/Linux) and `backend/mvnw.cmd` (Windows) are
> committed to the repository. If Maven is not installed globally, use them instead of `mvn` — they
> download the correct Maven version automatically on first use.

Ports used: **5432** (PostgreSQL), **8080** (backend API), **5173** (frontend).

---

## Quick start

All commands are run from the repository root unless stated otherwise.

### 1. Start PostgreSQL

**Option A — Docker (recommended)**

```bash
docker compose up -d
```

This starts PostgreSQL 16 with database `employee_management`, user `ems_user` and password
`ems_local_password` (local-only defaults).

**Option B — a locally installed PostgreSQL**

```bash
psql -U postgres -f database/create-database.sql
```

This creates the same role and database. You do **not** need to create tables: Flyway creates them when
the backend starts.

### 2. Start the backend

```bash
# macOS / Linux
cd backend
./mvnw spring-boot:run

# Windows
cd backend
mvnw.cmd spring-boot:run
```

On first start Flyway creates the `employees` table and loads 15 sample employees. The API is then
available at:

- API base: <http://localhost:8080/api/employees>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with the local development account **`admin` / `admin123`**
(change it with `EMS_ADMIN_USERNAME` and `EMS_ADMIN_PASSWORD`, see [Configuration](#configuration)).

> If you use different credentials or ports, set the environment variables in the next section instead of
> editing any source files.

---

## Configuration

Every setting has a safe local default, so nothing needs to be configured to run locally. No secrets are
committed; override the defaults with environment variables.

### Backend (`backend/src/main/resources/application.yml`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `EMS_DB_URL` | `jdbc:postgresql://localhost:5432/employee_management` | JDBC URL |
| `EMS_DB_USERNAME` | `ems_user` | Database user |
| `EMS_DB_PASSWORD` | `ems_local_password` | Database password (local default only) |
| `EMS_SERVER_PORT` | `8080` | HTTP port |
| `EMS_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origins allowed to call the API |
| `EMS_FLYWAY_LOCATIONS` | `classpath:db/migration,classpath:db/seed` | Set to `classpath:db/migration` to start **without** sample data |
| `EMS_ADMIN_USERNAME` | `admin` | Administrator username for login |
| `EMS_ADMIN_PASSWORD` | `admin123` | Administrator password (local default only; a warning is logged while it is in use) |

Example (macOS/Linux):

```bash
EMS_DB_PASSWORD=my-password EMS_SERVER_PORT=9090 mvn spring-boot:run
```

Example (Windows PowerShell):

```powershell
$env:EMS_DB_PASSWORD="my-password"; mvn spring-boot:run
```

### Frontend

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the backend API |

Copy `frontend/.env.example` to `frontend/.env` to change it. If you change the frontend port, also update
`EMS_CORS_ALLOWED_ORIGINS` on the backend.

### Docker Compose

`docker-compose.yml` reads `EMS_DB_NAME`, `EMS_DB_USERNAME`, `EMS_DB_PASSWORD` and `EMS_DB_PORT`, with the
same defaults as above.

---

## Running the tests

### Backend

```bash
# macOS / Linux
cd backend
./mvnw test

# Windows
cd backend
mvnw.cmd test
```

Expected output (no database required — all tests use Mockito / MockMvc):

```
Tests run: 44, Failures: 0, Errors: 0, Skipped: 0

BUILD SUCCESS
```

The backend tests do not need a database:

| Test class | What it covers |
|------------|----------------|
| `EmployeeServiceTest` | Create (normalisation, duplicate Employee ID, duplicate email in any capitalisation), get (found / not found), update (success, keeping own email, email taken by another employee, Employee ID change rejected, not found), delete (success / not found), search result mapping and empty results. Uses Mockito to mock the repository. |
| `EmployeePagingTest` | Zero-based paging, page-size limits, sort allowlist, sort direction parsing, id tie-breaker. |
| `EmployeeControllerTest` | HTTP contract with MockMvc: 201 + `Location`, 400 field errors, 400 for unknown status, 409 duplicate, 404 not found, list parameters reach the service, 400 for a sort field outside the allowlist. |
| `EmployeeCsvExporterTest` | CSV quoting and spreadsheet-formula protection. |
| `AuthSecurityTest` | Real security configuration with MockMvc: 401 JSON without a browser pop-up for missing, wrong or unknown credentials; write endpoints protected; `/api/auth/me` with valid credentials; no session cookie; CORS preflight allowed for the frontend origin and rejected for others. |

### Frontend

```bash
cd frontend
npm test          # Vitest: 41 tests
npm run build     # type-check (tsc) and production build
```

Frontend tests cover client-side validation rules, URL ↔ list-query handling, the form (validation,
double-submit prevention, server duplicate errors) and the list page (rendering, filters/paging/sort sent
together, empty state, unreachable server, delete only after confirmation), and login (redirect to the
login page when signed out, sign-in returns to the requested page, wrong password, logout, expired
credentials, CSV download with the Authorization header).

### Manual API checks

Import `postman/employee-management.postman_collection.json` into Postman and run the requests in order
(the Collection Runner works). Request 1 stores the new employee's id for the following requests. The
collection uses Basic auth with the `username` / `password` collection variables (default `admin` /
`admin123`).

Equivalent `curl` commands (`-u` sends the HTTP Basic credentials):

```bash
# Create (201)
curl -i -u admin:admin123 -X POST http://localhost:8080/api/employees \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"EMP-016","fullName":"Riya Kapoor","email":"riya.kapoor@example.com",
       "phone":"+91 98260 12345","department":"Engineering","designation":"Software Engineer",
       "joiningDate":"2024-09-02","salary":750000.00,"status":"ACTIVE"}'

# Same email in different case (409)
curl -i -u admin:admin123 -X POST http://localhost:8080/api/employees \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"EMP-017","fullName":"Riya K","email":"RIYA.KAPOOR@example.com",
       "phone":"+91 98260 12346","department":"Engineering","designation":"Software Engineer",
       "joiningDate":"2024-09-02","salary":750000.00,"status":"ACTIVE"}'

# Search + filters + paging + sort
curl -u admin:admin123 "http://localhost:8080/api/employees?search=a&department=Engineering&status=ACTIVE&page=0&size=5&sort=salary,desc"

# Get, update, delete (replace 16 with a real id)
curl -u admin:admin123 http://localhost:8080/api/employees/16
curl -i -u admin:admin123 -X PUT http://localhost:8080/api/employees/16 -H "Content-Type: application/json" \
  -d '{"employeeCode":"EMP-016","fullName":"Riya Kapoor","email":"riya.kapoor@example.com",
       "phone":"+91 98260 12345","department":"Engineering","designation":"Senior Software Engineer",
       "joiningDate":"2024-09-02","salary":900000.00,"status":"ACTIVE"}'
curl -i -u admin:admin123 -X DELETE http://localhost:8080/api/employees/16

# CSV export
curl -u admin:admin123 -o employees.csv "http://localhost:8080/api/employees/export?department=Engineering"

# Without credentials (401)
curl -i http://localhost:8080/api/employees
```

---

## API reference

Base path: `/api/employees`. Full, interactive documentation is in Swagger UI (click **Authorize** and
enter the administrator username and password to try requests). Every `/api/**` endpoint requires HTTP
Basic authentication; see [Authentication](#authentication).

| Method | Path | Description | Success | Errors |
|--------|------|-------------|---------|--------|
| `GET` | `/api/employees` | List with search, filters, paging, sorting | `200` page | `400` invalid page/size/sort/status |
| `GET` | `/api/employees/{id}` | Get one employee | `200` | `404` |
| `POST` | `/api/employees` | Create | `201` + `Location` header | `400` validation, `409` duplicate |
| `PUT` | `/api/employees/{id}` | Update all editable fields | `200` | `400`, `404`, `409` |
| `DELETE` | `/api/employees/{id}` | Delete | `204` | `404` |
| `GET` | `/api/auth/me` | Check credentials; returns the username | `200` | `401` |
| `GET` | `/api/employees/departments` | Distinct departments (for the filter) | `200` | — |
| `GET` | `/api/employees/export` | CSV of all employees matching the filters | `200 text/csv` | `400` |

`{id}` is the internal database id, not the Employee ID.

### List parameters

| Parameter | Default | Notes |
|-----------|---------|-------|
| `search` | — | Case-insensitive partial match on full name **or** email. `%` and `_` are treated literally. |
| `department` | — | Exact department name (values come from `/departments`). |
| `status` | — | `ACTIVE` or `INACTIVE`. |
| `page` | `0` | **Zero-based.** Negative values return `400`. A page past the end returns `200` with empty `content`. |
| `size` | `10` | 1–100, otherwise `400`. |
| `sort` | `fullName,asc` | `field,direction`. Fields: `employeeCode`, `fullName`, `email`, `department`, `designation`, `joiningDate`, `salary`, `status`. Direction: `asc` or `desc`. |

All filters are combined with AND.

### Page response

```json
{
  "content": [ { "id": 1, "employeeCode": "EMP-001", "fullName": "Aarav Sharma", "...": "..." } ],
  "page": 0,
  "size": 10,
  "totalElements": 15,
  "totalPages": 2,
  "first": true,
  "last": false,
  "sort": "fullName,asc"
}
```

### Employee request body (POST and PUT)

```json
{
  "employeeCode": "EMP-016",
  "fullName": "Riya Kapoor",
  "email": "riya.kapoor@example.com",
  "phone": "+91 98260 12345",
  "department": "Engineering",
  "designation": "Software Engineer",
  "joiningDate": "2024-09-02",
  "salary": 750000.00,
  "status": "ACTIVE"
}
```

The response adds `id`, `createdAt` and `updatedAt`.

### Error format

Every error uses the same shape:

```json
{
  "timestamp": "2026-10-15T17:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/employees",
  "fieldErrors": [
    { "field": "email", "message": "Email must be a valid address" },
    { "field": "salary", "message": "Salary cannot be negative" }
  ]
}
```

| Status | When |
|--------|------|
| `400` | Validation failure, malformed JSON, unknown enum value, invalid page/size/sort, or an attempt to change the Employee ID |
| `401` | Missing or invalid username/password (`message`: "Invalid or missing username and password") |
| `404` | No employee with that id, or unknown URL |
| `409` | Employee ID or email already used by another employee |
| `500` | Unexpected error (details are logged, not returned) |

---

## Design decisions

**Layering.** `EmployeeController` handles HTTP only (parameters, status codes, `Location` header).
`EmployeeService` holds business rules and transactions. `EmployeeRepository` (Spring Data JPA) handles
persistence. `GlobalExceptionHandler` turns every exception into the shared error format, so controllers
contain no try/catch.

**DTOs instead of entities.** `EmployeeRequest` / `EmployeeResponse` decouple the API from the table.
Clients cannot set `id`, `createdAt` or `updatedAt`, and schema changes do not leak into the API.

**Two identifiers.** `id` is a database-generated surrogate key used in URLs and joins. `employeeCode` is
the business "Employee ID" shown to users. Keeping them separate means the business ID format can change
without touching keys. The Employee ID cannot be edited after creation so it stays a stable reference.

**Uniqueness in two layers.** The service checks for duplicates first so it can return a clear `409` with
the offending field. The database also has unique constraints, which catch the rare race where two
requests pass the check at the same time; that case is also returned as `409`.

**Case-insensitive email.** Emails are trimmed and lower-cased before both the duplicate check and saving
(`EmployeeMapper.normalizeEmail`), so `Asha@X.com` and `asha@x.com` are the same. A database `CHECK`
constraint guarantees nothing un-normalised gets stored.

**Money.** Salary is `BigDecimal` in Java and `NUMERIC(12,2)` in PostgreSQL, never `double`, so there are
no floating-point rounding errors.

**Search and filters.** Built with JPA Specifications: each filter is an optional predicate combined with
AND, which keeps the query readable and avoids writing a repository method for every combination. User
input is passed as bind parameters (no SQL injection), and LIKE wildcards are escaped.

**Pagination and sorting.** Done in the database (`LIMIT/OFFSET` + `COUNT`) via Spring Data's `Pageable`,
so only one page travels over the network. Sort fields come from an allowlist, so clients cannot sort on
arbitrary or internal columns. The internal `id` is always added as a secondary sort, so rows with equal
values (e.g. two people in the same department) never appear on two pages or go missing. Page numbers are
zero-based, matching Spring Data.

**Indexes.** Unique indexes on `employee_code` and `email` (from the constraints) serve the duplicate checks;
B-tree indexes on `department` and `status` serve the filters.

**Transactions.** The service class is `@Transactional(readOnly = true)` by default; create, update and
delete are read-write transactions, so a failed check leaves no partial change.

**Schema management.** Flyway migrations own the schema and Hibernate runs with `ddl-auto: validate`, so
the schema is versioned and reproducible and Hibernate never silently alters tables. Sample data lives in
a separate location (`db/seed`) that can be switched off.

**CORS and configuration.** CORS is limited to `/api/**` and the configured frontend origin(s). All
connection settings come from environment variables with local defaults; no secrets are committed.

**Authentication.** Spring Security with HTTP Basic and one administrator account from configuration
(see [Authentication](#authentication)). It is stateless, so there is no session to store or expire on the
server, and it keeps the REST API easy to call from Postman, curl and Swagger UI.

**Frontend state in the URL.** Search, filters, page, size and sort live in the query string, so they
survive paging, refreshes and the back button, and a filtered view can be shared as a link. Search input
is debounced (300 ms) and stale requests are cancelled with `AbortController`.

---

## Authentication

| | |
|---|---|
| Method | HTTP Basic, stateless (no server session, no cookies) |
| Account | One administrator, `EMS_ADMIN_USERNAME` / `EMS_ADMIN_PASSWORD` (local default `admin` / `admin123`). The password is held only as a BCrypt hash. |
| Protected | Every `/api/**` endpoint |
| Public | Swagger UI (`/swagger-ui.html`) and the OpenAPI JSON (`/v3/api-docs`), plus CORS preflight (`OPTIONS`) requests |
| Check credentials | `GET /api/auth/me` → `200 {"username": "admin"}` or `401` |

How it works:

- The login page sends the username and password to `GET /api/auth/me`. On `200` the frontend keeps the
  `Authorization: Basic …` header value in memory and in `sessionStorage`, so a refresh keeps you signed in
  and closing the tab signs you out. Every API call sends that header.
- Signed-out users who open any page are sent to `/login`, then returned to the page they asked for.
- If the API ever answers `401` (for example after the password was changed), the stored credentials are
  cleared and the user is sent back to the login page with a message.
- Failed authentication returns `401` in the usual JSON error format and **without** a `WWW-Authenticate`
  header, so browsers never show their own login pop-up.
- CSRF protection is disabled because the API uses no cookies or sessions: a malicious site cannot make the
  browser attach the `Authorization` header automatically.
- CSV export is downloaded with `fetch` (so it can send the header) and saved as `employees.csv`.

Security notes: HTTP Basic sends the credentials with every request, so outside `localhost` it must only
be used over HTTPS. Anything in `sessionStorage` can be read by scripts on the page, which is acceptable
here because the app renders no untrusted HTML; a production system would more likely use short-lived
tokens or a server session with an `HttpOnly` cookie.

---

## Assumptions

| Topic | Assumption |
|-------|-----------|
| Employee ID | Entered by the administrator; 3–20 letters, digits or hyphens (e.g. `EMP-016`); stored upper-case; unique; cannot be changed after creation. |
| Email | Must contain `@` and a dot in the domain; stored lower-case; unique regardless of capitalisation. |
| Phone | Optional leading `+`, then digits, spaces, hyphens or brackets, with 7–15 digits in total (the international E.164 maximum). No country-specific rule, so valid international numbers are accepted. |
| Salary | Annual salary in INR; 0 or more; up to 10 integer digits and 2 decimal places. |
| Date of joining | Required; cannot be in the future (server date). |
| Department | Free text (max 60 chars), so new departments need no code change. The filter dropdown lists departments currently in use. |
| Status | `ACTIVE` or `INACTIVE`. |
| Delete | Hard delete after confirmation in the UI. |

---

## Project structure

```
.
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/kloudspot/ems/
│       │   ├── EmployeeManagementApplication.java
│       │   ├── config/            CorsConfig, OpenApiConfig, SecurityConfig
│       │   ├── auth/              AuthController (/api/auth/me), JSON 401 entry point
│       │   ├── common/error/      ApiError, GlobalExceptionHandler, custom exceptions
│       │   └── employee/          Employee (entity), EmployeeController, EmployeeService,
│       │                          EmployeeRepository, EmployeeSpecifications, EmployeePaging,
│       │                          EmployeeMapper, EmployeeCsvExporter, dto/
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/      Flyway schema;   db/seed/  sample data
│       └── test/java/...          JUnit 5 + Mockito tests
├── frontend/
│   └── src/
│       ├── api/                   typed API client and types
│       ├── auth/                  session storage, AuthProvider, RequireAuth, login API
│       ├── components/            EmployeeForm, ConfirmDialog, Pagination, StatusBadge, FlashNotice
│       ├── pages/                 Login, List, Details, Create, Edit pages and URL query helpers
│       └── utils/                 formatting and client-side validation
├── database/create-database.sql   one-time DB/role setup for a local PostgreSQL
├── postman/                       Postman collection
├── docs/screenshots/              screenshots for the submission
└── docker-compose.yml             local PostgreSQL
```

---

## Screenshots / demo

Screenshots of the running application go in [`docs/screenshots`](docs/screenshots) (a checklist of
suggested shots is in that folder). To capture them:

1. Start the database, backend and frontend as in [Quick start](#quick-start).
2. Capture: the login page (and the wrong-password message); the employee list; the list with a search, department and status filter and a sorted column;
   page 2; the Add form showing validation errors; the duplicate-email error; the details page; the edit
   form; the delete confirmation dialog; the list on a phone-sized window (browser dev tools → device
   toolbar); and Swagger UI at <http://localhost:8080/swagger-ui.html>.
3. Optionally record a 1–2 minute screen capture walking through create → search/filter/page → view → edit
   → delete.

---

## Known limitations

- **Single administrator, no roles.** Login supports one account from configuration; there is no user
  management, password reset or role-based permissions.
- **No login rate limiting.** Repeated wrong passwords are not slowed down or locked out. Every API call
  also re-checks the BCrypt password hash, which adds a little latency per request.
- **No department management.** Departments are free text; there is no screen to create or rename them.
- **Last write wins on concurrent edits.** Two administrators editing the same employee at once will not
  be warned; adding a JPA `@Version` column (optimistic locking) would fix this.
- **Search uses `LIKE '%text%'`.** Fine for thousands of rows; for very large tables a trigram index
  (`pg_trgm`) or full-text search would be needed.
- **Joining date "today"** is checked against the server date; users in time zones far from the server
  may see a one-day edge case around midnight.
- **No repository/database integration tests.** Backend tests use mocks and MockMvc; a Testcontainers
  PostgreSQL test for the Flyway migration and queries would be a useful addition.
