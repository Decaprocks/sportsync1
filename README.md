# 🏟️ SportSync – Intelligent Athletic Matchmaking & Venue Management System

A database-centric sports management system that enables intelligent player matchmaking and real-time venue booking using advanced DBMS concepts.

![SportSync](https://img.shields.io/badge/Node.js-Express-green) ![MySQL](https://img.shields.io/badge/Database-MySQL-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **ELO-based Matchmaking** – Intelligent player pairing based on skill ratings
- **Real-time Venue Booking** – Transaction-safe resource reservation with double-booking prevention
- **Leaderboard & Analytics** – Player rankings, win rates, and rating history
- **Venue Reviews** – Hybrid SQL–NoSQL storage for unstructured feedback
- **Role-based Access** – Player, Venue Manager, and Admin dashboards
- **ACID Compliance** – Full transaction control with row-level locking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL (SQL + Stored Procedures) |
| NoSQL | JSON Document Storage |
| Auth | bcrypt.js, Express Sessions |
| Architecture | Three-Tier (Presentation → Application → Database) |

## 📚 DBMS Concepts Implemented

1. **EER Modeling** – User → Player / Venue Manager specialization
2. **BCNF Normalization** – All tables free of redundancy
3. **Constraints** – PK, FK, UNIQUE, CHECK, NOT NULL
4. **Triggers** – Eligibility check, ELO update, double-booking prevention
5. **Stored Procedures** – `Update_ELO()`, `Book_Resource()` with transactions
6. **Transaction Management** – START TRANSACTION, COMMIT, ROLLBACK
7. **Concurrency Control** – `SELECT ... FOR UPDATE` row-level locking
8. **Indexing** – B-Tree composite indexes on frequently queried columns
9. **Views** – Leaderboard, recent matches, venue availability
10. **Hybrid SQL–NoSQL** – JSON storage for unstructured reviews

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/SportSync.git
cd SportSync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure database
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 4. Set up MySQL database
```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p sportsync < database/02_triggers.sql
mysql -u root -p sportsync < database/03_procedures.sql
mysql -u root -p sportsync < database/04_indexes.sql
mysql -u root -p sportsync < database/05_views.sql
mysql -u root -p sportsync < database/06_seed_data.sql
```

### 5. Start the server
```bash
npm run dev
```

Open **http://localhost:3000**

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Player | arjun@email.com | password123 |
| Venue Manager | rajesh@email.com | password123 |
| Admin | admin@sportsync.com | password123 |

## 📁 Project Structure

```
├── server.js              # Express server entry point
├── config/db.js           # MySQL connection pool
├── database/
│   ├── 01_schema.sql      # EER model + BCNF tables
│   ├── 02_triggers.sql    # 3 triggers
│   ├── 03_procedures.sql  # 4 stored procedures
│   ├── 04_indexes.sql     # B-Tree composite indexes
│   ├── 05_views.sql       # 4 database views
│   └── 06_seed_data.sql   # Sample data
├── routes/                # 8 API route modules
├── public/
│   ├── css/style.css      # Dark theme design system
│   ├── js/app.js          # Shared frontend utilities
│   └── *.html             # 8 frontend pages
└── data/reviews.json      # NoSQL document store
```

## 📄 License

This project is for educational purposes as part of a DBMS engineering course.
