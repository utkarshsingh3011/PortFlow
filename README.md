# 🚢 PortFlow

> Production-inspired customs broker onboarding platform built with FastAPI, PostgreSQL, React, TypeScript and Tailwind CSS.

PortFlow digitizes the customs broker onboarding process by replacing manual paperwork with a secure workflow-driven platform for customer management, document verification, compliance tracking and audit reporting.

It provides brokers with a centralized workspace to manage importer onboarding through a structured 7-step customs clearance process while maintaining complete audit history and document storage.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Screenshots

### Landing Page

![Landing Page](screenshots/landing-page.png)

---

### Broker Dashboard

![Dashboard](screenshots/dashboard.png)

---

### Customer Profile

![Customer Profile](screenshots/customer-profile.png)

---

### Onboarding Workflow

![Workflow](screenshots/onboarding-workflow.png)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema & Migrations](#database-schema--migrations)
- [API Endpoints](#api-endpoints)
- [Security Considerations](#security-considerations)
- [Report Exports (PDF & JSON)](#report-exports-pdf--json)
- [Future Improvements](#future-improvements)

---

## Project Overview

Customs brokers manage complex regulatory onboarding steps for trade businesses—including Import Export Code (IEC) verification with DGFT, Customs Power of Attorney (PoA) execution, AD Code bank registrations, and ICEGATE portal EDI linkage.

**PortFlow** transforms this traditionally paper-heavy process into an automated, operational workspace where brokers can track progress, verify documents, audit timeline events, and issue compliance reports.

---

## Key Features

1. **Broker Authentication & Security**:
   - Secure broker registration and login with bcrypt password hashing.
   - Stateless JWT authentication for secure API access.
   - Protected frontend routes using React Router.
   - Broker-level data isolation ensuring brokers only manage their assigned customers.

2. **Interactive 7-Step Customs Onboarding Wizard**:
   - **Step 1**: DGFT Import Export Code (IEC) & GSTIN Verification.
   - **Step 2**: Customs Power of Attorney (PoA) Authorization.
   - **Step 3**: Step 3: AD Code & Port Registration.
   - **Step 4**: KYC Document Vault Verification.
   - **Step 5**: Step 5: ICEGATE Registration & DSC Details.
   - **Step 6**: Duty Deferment Facility & Export License Setup.
   - **Step 7**: Compliance Audit Sign-off & Final Account Activation.

3. **Production Document Management Vault**:
   - Upload, preview, replace, download, and delete required customs documents (GST Certificate, IEC Certificate, PAN Card, Power of Attorney, Cancelled Cheque, Address Proof).
   - Saved securely with disk storage and metadata linked in PostgreSQL.

4. **Real Audit Activity System**:
   - Automatically logs events (`customer_created`, `customer_updated`, `step_completed`, `document_uploaded`, `document_deleted`) in PostgreSQL.
   - Reverse chronological activity feed.

5. **Operational Broker Workspace Dashboard**:
   - Dashboard metrics (Total Customers, Active Journeys, Completed Verification Steps, Average Progress %).
   - 1-click **Resume Onboarding** shortcuts for active customer flows.
   - Recent customer tables, pending verification queues, and audit feeds.

6. **Multi-Format Report Exports (PDF & JSON)**:
   - **Printable PDF Audit Report**: Formatted multi-page print view with company profile, progress gauge, 7-step status breakdown, document vault summary, and timeline audit log.
   - **Structured JSON Export**: Export complete customer onboarding data for integration with external ERP/CRM systems.

7. **Responsive User Experience**:
   - Responsive interface for desktop, tablet, and mobile devices.
   - Clean dashboard for brokers with intuitive navigation.
   - Landing page showcasing platform capabilities and workflow.

---

## Tech Stack

## Backend

- **Framework:** FastAPI (Python 3.11+)
- **Language:** Python
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy 2.0 (Async)
- **Database Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** JWT (PyJWT) + Passlib (bcrypt)
- **Server:** Uvicorn

## Frontend

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## Architecture

PortFlow follows a decoupled Client-Server REST API architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      React 18 Frontend                      │
│      (Vite + TypeScript + Tailwind CSS + Lucide Icons)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST / JSON / Multi-Part
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend API                     │
│         (JWT Auth + CORS Middleware + Dependency Inject)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Async ORM                    │ Disk Storage
               ▼                              ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│     PostgreSQL Database      │ │ Uploads Directory         │
│ (Customers, Flows, Documents)│ │ (backend/uploads/docs)   │
└──────────────────────────────┘ └───────────────────────────┘
```

---

## Folder Structure

```
PortFlow/
├── backend/
│   ├── alembic/                      # Alembic database migrations
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/            # Auth, Customers, Onboarding, Documents, Users
│   │   │   ├── deps.py               # JWT dependency injection & auth guard
│   │   │   └── router.py             # API Router aggregator
│   │   ├── core/                     # Config, Security, Exception handlers
│   │   ├── database/                 # Async Engine & Session management
│   │   ├── models/                   # SQLAlchemy models (User, Customer, Flow, Step, Document, Activity)
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   ├── services/                 # Business logic & Database services
│   │   └── main.py                   # FastAPI application factory
│   ├── uploads/documents/            # Physical document storage directory
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/               # Common UI, Auth, Customers, Onboarding, Documents
    │   ├── context/                  # AuthContext & State management
    │   ├── hooks/                    # Custom hooks (useAuth)
    │   ├── pages/                    # Landing, Auth, Dashboard, Customers, Onboarding
    │   ├── services/                 # API Clients (auth, customer, onboarding, document)
    │   ├── types/                    # TypeScript type definitions
    │   ├── utils/                    # Export utilities (PDF & JSON generators)
    │   ├── App.tsx                   # Main React router
    │   └── index.css                 # Global CSS tokens & styles
    ├── package.json
    └── vite.config.ts
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (v14+)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Alembic Database Migrations
alembic upgrade head

# Start FastAPI Dev Server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

The application will be accessible at: `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PROJECT_NAME="PortFlow"
SECRET_KEY="your_super_secret_jwt_key_here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/portflow"
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL="http://localhost:8000/api/v1"
```

---

## Authentication & Authorization

- **Registration & Login**: Brokers register with company name, full name, email, and password.
- **Bcrypt Hashing**: Passwords hashed using `passlib[bcrypt]`.
- **JWT Authentication**: Authenticated requests carry `Authorization: Bearer <token>`.
- **Route Protection**: React Router guards redirect unauthenticated users to `/login`.
- **Data Isolation**: Database queries enforce `where(Customer.broker_id == current_user.id)` to guarantee privacy between brokers.

---

## Database Schema & Migrations

PortFlow uses PostgreSQL with Alembic version control:

- `users`: Broker accounts (`id`, `company_name`, `full_name`, `email`, `hashed_password`).
- `customers`: Importer/Exporter profiles (`id`, `broker_id`, `name`, `email`, `gstin`, `customer_type`).
- `onboarding_flows`: Assigned onboarding journeys (`id`, `customer_id`, `user_id`, `title`, `status`).
- `onboarding_steps`: Step form data (`id`, `flow_id`, `order`, `title`, `status`, `data`).
- `customer_documents`: Uploaded document vault (`id`, `customer_id`, `step_id`, `document_type`, `filename`, `file_path`, `file_size`).
- `customer_activities`: Persistent audit log (`id`, `customer_id`, `user_id`, `event_type`, `title`, `description`, `created_at`).

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new broker account |
| `POST` | `/api/v1/auth/login` | Authenticate broker and return JWT token |
| `GET` | `/api/v1/customers` | List broker customers (paginated) |
| `POST` | `/api/v1/customers` | Create new customer account |
| `GET` | `/api/v1/customers/{id}` | Get customer profile details |
| `PUT` | `/api/v1/customers/{id}` | Update customer attributes |
| `DELETE`| `/api/v1/customers/{id}` | Delete customer account |
| `GET` | `/api/v1/customers/activities/recent` | List broker recent activity timeline |
| `GET` | `/api/v1/onboarding/flows` | List active onboarding flows |
| `PATCH` | `/api/v1/onboarding/steps/{id}` | Update step form data & status |
| `POST` | `/api/v1/customers/{id}/documents` | Upload customer KYC document |
| `GET` | `/api/v1/documents/{id}/download` | Download customer document file |

---

## Security Considerations

- **Strict CORS Policy**: Restricted to configured frontend origins.
- **SQL Injection Prevention**: Parameterized queries enforced via SQLAlchemy ORM.
- **Input Sanitation**: Pydantic v2 models validate and sanitize request payloads.
- **Secure File Storage**: Unique file names generated on upload to prevent directory traversal.

---

## Report Exports (PDF & JSON)

Brokers can export customer profiles and onboarding status reports:
- **PDF Report**: Generates a clean, branded HTML print document with company details, progress gauge, 7-step audit table, uploaded document vault summary, and activity timeline.
- **JSON Export**: Downloads structured JSON containing full customer metadata, step submissions, document records, and activity timestamps.

---

## Future Improvements

- [ ] Webhook integration for real-time DGFT and ICEGATE portal status checks.
- [ ] Multi-user team permissions (Broker Admin, Field Agent, Auditor roles).
- [ ] Email notifications to customers upon step completions.
- [ ] Automated OCR parsing of uploaded GSTIN and IEC certificates.
