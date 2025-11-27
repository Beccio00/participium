# Participium - Demo 2

> Citizen participation platform for reporting and collaboratively managing urban issues in the Municipality of Turin.

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Implementation Details](#3-implementation-details)
4. [Contributing](#contributing)

---

## 1. Project Overview

### 1.1 What is Participium?

Participium is a civic engagement platform that enables citizens to report urban issues (potholes, architectural barriers, waste, lighting malfunctions, etc.) directly to the Municipality of Turin. Citizens select a location on an interactive map, describe the problem, and attach photos. Municipal offices then validate, assign, and manage these reports through a complete lifecycle, keeping citizens informed at every step via in-app notifications.

### 1.2 User Roles

- **Citizen**: Registers, submits reports, tracks report status, and configures in-app notification preferences.
- **Administrator**: Creates municipality user accounts and assigns roles.
- **Public Relations**: Reviews incoming reports and approves or rejects them with explanations.

**Technical Office Roles** (receive assigned reports, update statuses, communicate with citizens, and resolve issues):

- **Culture Events Tourism Sports**
- **Local Public Services**
- **Education Services**
- **Public Residential Housing**
- **Information Systems**
- **Municipal Building Maintenance**
- **Private Buildings**
- **Infrastructures**
- **Greenspaces and Animal Protection**
- **Waste Management**
- **Road Maintenance**
- **Civil Protection**

### 1.3 Report Categories

- **Water Supply – Drinking Water**
- **Architectural Barriers**
- **Sewer System**
- **Public Lighting**
- **Waste**
- **Road Signs and Traffic Lights**
- **Roads and Urban Furnishings**
- **Public Green Areas and Playgrounds**
- **Other**

### 1.4 Report Lifecycle

Reports progress through the following statuses:

- **Pending Approval**: Initial submission awaiting public relations review.
- **Assigned**: Approved and routed to the competent technical office.
- **In Progress**: Intervention scheduled or work started.
- **Suspended**: Temporarily halted, awaiting evaluation or resources.
- **Resolved**: Work completed, with optional closing comments.
- **Rejected**: Not accepted, with mandatory explanation.

## 2. Getting Started

### 2.1 Prerequisites

**For Docker setup (Recommended):**

- Docker Desktop or Docker Engine + Docker Compose
- Git

**For local setup:**

- Node.js ≥ 18
- PostgreSQL ≥ 14
- MinIO (or S3-compatible storage)
- Git

### 2.2 Docker Compose Setup (Recommended)

The fastest way to run Participium is with Docker Compose, which handles all dependencies automatically.

#### 2.2.1 Start Services

```bash
git clone <repo-url>
cd participium
docker compose up --build
```

This single command launches:

- PostgreSQL database
- MinIO object storage
- Backend API server
- Frontend development server

#### 2.2.2 Access Points (with Docker)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **MinIO Console**: http://localhost:9001 (credentials in `docker-compose.yml`)

#### 2.2.3 Test Accounts

Seeded automatically on startup:

| Role                              | Email                        | Password    |
| --------------------------------- | ---------------------------- | ----------- |
| Administrator                     | admin@participium.com        | adminpass   |
| Citizen                           | citizen@participium.com      | citizenpass |
| Public Relations                  | pr@participium.com           | prpass      |
| Public Relations                  | techPR@participium.com       | techpass    |
| Municipal Building Maintenance    | tech@participium.com         | techpass    |
| Culture Events Tourism Sports     | culture@participium.com      | techpass    |
| Local Public Services             | localpublic@participium.com  | techpass    |
| Education Services                | education@participium.com    | techpass    |
| Public Residential Housing        | residential@participium.com  | techpass    |
| Information Systems               | infosys@participium.com      | techpass    |
| Private Buildings                 | privatebuild@participium.com | techpass    |
| Greenspaces and Animal Protection | greenspaces@participium.com  | techpass    |
| Road Maintenance                  | road@participium.com         | techpass    |
| Civil Protection                  | civilprot@participium.com    | techpass    |
| Infrastructures                   | infra@participium.com        | infrapass   |
| Waste Management                  | waste@participium.com        | wastepass   |

### 2.3 API Documentation

Participium includes interactive API documentation via Swagger UI.

**Access**: http://localhost:3000/api-docs

The documentation is generated from `docs/swagger.yaml` and allows you to:

- Browse all available endpoints
- View request/response schemas
- Test API calls directly from the browser
- Understand authentication requirements

### 2.4 Running Tests

#### Frontend Tests (Vitest)

```bash
cd client
npm test              # Run once
npm run test:watch    # Watch mode
```

Frontend tests use **Vitest** + **Testing Library** for fast, user-centric testing.

#### Backend Tests (Jest)

```bash
cd server
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Backend tests use **Jest** for unit and integration testing of services, controllers, and middleware.

---

## 3. Implementation Details

### 3.1 Architecture

**Stack Overview:**

- **Frontend**: React 18 + TypeScript + Vite + Leaflet/React-Leaflet
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 14+
- **Storage**: MinIO (S3-compatible object storage)

**Directory Structure:**

```
participium/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # API abstraction
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Domain-specific feature modules
│   │   ├── hooks/           # Custom React hooks
│   │   ├── styles/          # CSS and style modules
│   │   ├── types/           # Frontend type definitions
│   │   ├── validators/      # Form validation logic
│   │   └── main.tsx
│   └──test/                 # Frontend tests
|
├── server/                  # Express + Prisma backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/     # Request handling
│   │   ├── interfaces/      # DTOs, type interfaces
│   │   ├── middlewares/     # Validation, uploads, error handling
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Seed script for test data
│   │   └── migrations/      # Prisma migrations
│   └── test/                # Backend tests
│
├── shared/                  # Shared TypeScript types
└── docs/                    # API documentation (Swagger, Docker, etc.)
```

### 3.2 Key Technical Decisions

#### 3.2.1 Frontend Development

Participium uses **Vite** as its frontend build tool to provide a much faster and smoother development experience compared to older solutions like Create React App. Vite starts up quickly, updates the app instantly as developers make changes, and produces optimized builds for production. This means developers can work more efficiently, see their changes right away, and spend less time waiting—resulting in a better, more responsive platform for everyone.

#### 3.2.2 Type Safety

Participium uses **TypeScript** throughout the entire project—on the frontend, backend, and for shared types—to ensure consistency, safety, and easier maintenance. By defining domain types in one place, the platform avoids errors and keeps data structures aligned across all parts of the application. TypeScript checks for mistakes before the code runs, making the platform more reliable and easier to update or expand. It also improves the developer experience, as the code is easier to understand and refactor, and serves as its own documentation.

#### 3.2.3 Data Storage

Participium uses **PostgreSQL** as its main database because it is a powerful, open-source, and highly reliable relational database system. PostgreSQL is well-suited for applications that require strong data consistency, complex queries, and scalability. Its robust support for transactions and data integrity ensures that all report, user, and messaging data is stored safely and can be efficiently retrieved or updated as the platform grows. PostgreSQL is also widely supported in the developer community, making it a future-proof choice for long-term maintenance and enhancements.

#### 3.2.4 Database Management

Participium uses **Prisma** as its database toolkit to ensure data is managed safely, efficiently, and in a way that supports future growth. Prisma makes it easy to define and update the structure of the database, helps prevent common programming errors by checking data types automatically, and provides tools for evolving the database as the platform develops. It also offers a smooth developer experience, making it easier to maintain and extend the application over time. Prisma was chosen over alternatives like TypeORM because it provides stronger type safety and a more modern, reliable approach to working with data.

#### 3.2.5 Photo Storage

Photos are an important part of reporting urban issues, but storing images directly in the main database can make the platform slow and difficult to manage as it grows. To solve this, Participium uses **MinIO**, a specialized system for storing large files like photos. This approach keeps the platform fast and responsive, because the database only needs to keep track of the links to the images, not the images themselves. It also makes the platform more scalable and cost-effective, since MinIO is designed to handle large amounts of data efficiently. As a result, users can upload and view photos quickly, and the platform can easily grow to support more reports and images in the future.

#### 3.2.6 Map

The interactive map, built with the open-source libraries **Leaflet** and **React-Leaflet**, is a key part of the user experience. These libraries were chosen because they are free, widely used, and do not require any API keys or subscriptions, ensuring that the platform is accessible to everyone without hidden costs. The map uses open, community-maintained data and is designed to be fast, intuitive, and highly customizable for urban reporting needs. Even as the number of reports grows, the map remains clear and easy to navigate by automatically grouping nearby reports, so users can quickly explore and understand the distribution of issues across the city.

---

## Contributing

To contribute, simply open an issue on GitHub to discuss your idea or report a bug. Thank you!

---

## License

See `LICENSE` file for details.

---
