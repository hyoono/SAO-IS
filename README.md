# SAO-IS — Student Affairs Office Information System

> Web-Based Document Management System for Mapúa Malayan Colleges Laguna (MMCL)

## Overview

SAO-IS is a document management and workflow system built for the Student Affairs Office (SAO) of MMCL. It handles student records, organization accreditation documents, event permits, and clearances with a multi-step approval workflow engine.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Laravel 11 (PHP 8.2) |
| Database | MySQL 8 |
| Auth | Laravel Sanctum (SPA cookies) + MS365 SSO (optional) |
| HTTP Client | Axios + React Query |

## User Roles

| Role | Description |
|---|---|
| `admin` | Full system access — manage users, workflows, audit logs |
| `staff` | Operations — approve/reject, manage documents |
| `org_officer` | Upload, submit forms, track own submissions |
| `student` | Submit forms/docs, view own submission status |
| `faculty` | Endorse docs as workflow step, view assigned |

## Local Development Setup

### Prerequisites

- PHP 8.2 with extensions: mysql, mbstring, xml, curl, zip, bcmath, tokenizer, fileinfo
- Composer 2.x
- Node.js 20 LTS + npm
- MySQL 8.x
- Nginx (for production deployment)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure database credentials in .env, then:
php artisan migrate
php artisan db:seed
php artisan serve
```

The Laravel dev server starts at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

### Database Setup

```sql
CREATE DATABASE sao_is CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sao_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sao_is.* TO 'sao_user'@'localhost';
FLUSH PRIVILEGES;
```

## Deployment

This system is designed for LAN-only deployment on a repurposed desktop PC running Windows 10/11 with WSL2 (Ubuntu 22.04). See `docs/deployment/DEPLOY.md` for detailed instructions.

## Repository Structure

```
SAO-IS/
├── backend/          # Laravel 11 application
├── frontend/         # React + Vite application
├── docs/             # Documentation
├── scripts/          # Deployment and utility scripts
└── README.md
```

## License

This project is developed as an OJT-commissioned system for MMCL. All rights reserved.
