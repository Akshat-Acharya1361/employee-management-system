-- One-time setup for a locally installed PostgreSQL (skip this if you use docker compose).
-- Run as a superuser, e.g.:  psql -U postgres -f database/create-database.sql
--
-- The application creates its own tables on startup via Flyway
-- (backend/src/main/resources/db/migration), so only the role and database are needed here.
-- The password is a local development default; change it and set EMS_DB_PASSWORD for any shared environment.

CREATE ROLE ems_user WITH LOGIN PASSWORD 'ems_local_password';
CREATE DATABASE employee_management OWNER ems_user;
