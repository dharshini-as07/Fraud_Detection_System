# Real-Time Financial Fraud Detection and Alert System
### A MERN Stack-Based Approach for Detecting Suspicious Financial Transactions

> **Important Note:** This is a deterministic **Rule-Based Risk Scoring System**. It does **not** rely on black-box Artificial Intelligence or Machine Learning models. All risk decisions follow explainable, auditable rules based on transaction behavioral analytics. AI/ML is documented under Future Enhancements.

---

## 📌 Project Overview
The **Real-Time Financial Fraud Detection and Alert System** is a full-stack web application built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js) with **Socket.IO**. It monitors incoming customer transactions in real-time, calculates an explainable risk score (0 to 100) across 5 deterministic security rules, classifies transactions into risk tiers (**LOW**, **MEDIUM**, **HIGH**), automatically approves or holds/blocks transactions, and streams instantaneous fraud alerts to connected Compliance Administrators.

---

## 🚀 Key Features

### 👤 Customer Features
- **User Authentication:** Secure registration and login using JWT tokens and bcrypt password hashing.
- **Account Dashboard:** Overview of total transactions, approved transfers, pending reviews, and blocked fraud attempts.
- **Transaction Submission:** Real-time transfer form capturing receiver, beneficiary account, transfer amount, device fingerprint, and geographic location.
- **Pre-Configured Demo Presets:** One-click presets to simulate **LOW**, **MEDIUM**, and **HIGH** risk scenarios during presentations and viva evaluations.
- **Interactive Risk Audit:** Immediate visibility of computed risk score (0–100), visual risk badge, status, and itemized rule breakdown.
- **Transaction History:** Paginated table with search by ID/receiver, status filters, and detailed audit modals.
- **Profile Management:** Update personal details and securely change passwords.

### 👑 Administrator & Compliance Features
- **Centralized Dashboard:** Top metric cards displaying total transactions, risk distributions (Low, Medium, High), and unresolved fraud alerts.
- **Live Socket.IO Stream:** Instantaneous popup banner and real-time counter updates whenever a suspicious (Medium/High) transaction is flagged.
- **Audio Chime Alerts:** Optional toggleable sound notification on incoming fraud alerts.
- **Master Transaction Repository:** Filter by risk level and status, search by customer, beneficiary, or location.
- **Compliance Actions:** 1-click **Manual Approve** or **Block** with reason audit logs.
- **Alert Investigation Center:** Dedicated view of all alerts with priority classification, customer metadata, and resolution workflows.

---

## ⚙️ Fraud Detection Rule Engine

Located in `backend/services/fraudDetection.js`, the engine computes a composite risk score between **0 and 100 points** based on the following deterministic rules:

| Rule # | Security Rule Name | Trigger Condition | Points Added |
| :--- | :--- | :--- | :---: |
| **Rule 1** | **Unusual Transaction Amount** | Amount is $>3\times$ user's historical average (or $>2\times$ and $\ge ₹30,000$) | **+25** |
| **Rule 2** | **Rapid Repeated Transactions** | $\ge 2$ transactions in last 5 minutes OR $\ge 1$ within 2 minutes | **+20** |
| **Rule 3** | **New Beneficiary** | Receiver / Beneficiary account identifier has never been sent money by this user before | **+20** |
| **Rule 4** | **Unrecognized Device** | Device fingerprint (`deviceId`) has not been previously registered for this account | **+15** |
| **Rule 5** | **Unusual Location** | Geographic location is not present in user's recent transaction history | **+10** |

$$\text{Total Score} = \min(100, \sum \text{Triggered Points})$$

### Risk Classification & Actions
- **🟢 0 – 30 Points (LOW Risk):** Automatically **APPROVED** for normal clearing. No alert generated.
- **🟡 31 – 70 Points (MEDIUM Risk):** Placed in **REVIEW** status. Generates a Medium-priority alert to Compliance Admins.
- **🔴 71 – 100 Points (HIGH Risk):** Automatically **BLOCKED** to protect account funds. Generates a High-priority alert broadcast in real-time via Socket.IO.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, Socket.IO Client, Lucide React, Custom CSS Design System |
| **Backend** | Node.js, Express.js, Socket.IO, JSON Web Tokens (JWT), bcryptjs, CORS, dotenv |
| **Database** | MongoDB (v6.0+), Mongoose ODM |
| **Environment** | macOS / Linux / Windows, npm, Node.js (v18+) |

---

## 🏗️ System Architecture

```text
  [ Customer Browser ]                     [ Admin Compliance Dashboard ]
           │                                             │
      HTTP POST /api/transactions                 Socket.IO (admin_room)
           │                                             ▲
           ▼                                             │
   ┌──────────────────────────────────────────────────────────────┐
   │                  Express.js REST API Server                  │
   │                                                              │
   │   1. Retrieve past history from MongoDB                      │
   │   2. Execute calculateRisk(txn, history)                     │
   │   3. Evaluate Rules 1 - 5 (0 to 100 points)                  │
   │   4. Classify: LOW / MEDIUM / HIGH                           │
   │   5. Persist Transaction in MongoDB                          │
   │   6. If MEDIUM/HIGH -> Persist Alert & Emit via Socket.IO ───┘
   └──────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                          [ MongoDB Database ]
                    - users (customers, admins)
                    - transactions (audit logs)
                    - alerts (suspicious flags)
```

---

## 📁 Project Structure

```text
fraud-detection-system/
├── package.json                   # Root scripts for multi-package management
├── README.md                      # Comprehensive documentation
│
├── backend/                       # Node.js + Express + Socket.IO Backend
│   ├── .env                       # Environment configuration
│   ├── .env.example               # Example template
│   ├── package.json               # Backend dependencies
│   ├── server.js                  # Server entry & Socket.IO initialization
│   ├── seeder.js                  # Database seeder for demo accounts & test data
│   ├── config/
│   │   └── db.js                  # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Profile endpoints
│   │   ├── transactionController.js # Transaction creation & risk scoring
│   │   └── adminController.js     # Admin metrics, transactions, alert review
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification middleware
│   │   └── adminMiddleware.js     # Role-based admin access control
│   ├── models/
│   │   ├── User.js                # Customer & Admin user schema
│   │   ├── Transaction.js         # Transaction & risk score schema
│   │   └── Alert.js               # Fraud alert schema
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth routes
│   │   ├── transactionRoutes.js   # /api/transactions routes
│   │   └── adminRoutes.js         # /api/admin routes
│   └── services/
│       ├── fraudDetection.js      # Rule-Based Risk Engine (Rules 1-5)
│       └── alertService.js        # Alert generator & Socket.IO broadcaster
│
└── frontend/                      # React + Vite Frontend
    ├── index.html                 # HTML entry with font preloads
    ├── vite.config.js             # Vite config & API reverse proxy
    ├── package.json               # Frontend dependencies
    └── src/
        ├── main.jsx               # React DOM root
        ├── App.jsx                # Routing & Protected Route setup
        ├── context/
        │   └── AuthContext.jsx    # Authentication & User state provider
        ├── services/
        │   ├── api.js             # Axios instance with JWT interceptors
        │   └── socket.js          # Socket.IO client singleton
        ├── styles/
        │   └── global.css         # Modern banking/security UI stylesheets
        ├── components/
        │   ├── Navbar.jsx         # Header with live Socket.IO pulse indicator
        │   ├── Sidebar.jsx        # Role-aware navigation sidebar
        │   ├── ProtectedRoute.jsx # Route authentication & role guard
        │   ├── RiskBadge.jsx      # Low / Medium / High visual badges
        │   ├── TransactionTable.jsx # Reusable data table with action buttons
        │   ├── AlertCard.jsx      # Alert feed card with time elapsed & reasons
        │   ├── SummaryCard.jsx    # Metric statistic card
        │   └── Modal.jsx          # Audit details & action confirmation dialog
        └── pages/
            ├── Login.jsx          # Sign In with 1-click test credentials
            ├── Register.jsx       # Customer registration form
            ├── CustomerDashboard.jsx # Customer overview & activity feed
            ├── CreateTransaction.jsx # Transfer form with 1-click rule tests
            ├── Transactions.jsx   # Searchable customer history
            ├── Profile.jsx        # Profile details & password update
            ├── AdminDashboard.jsx # Admin metrics, real-time alert feed & stream
            ├── AdminTransactions.jsx # Master transaction list & approve/block
            └── AdminAlerts.jsx    # Fraud alert resolution center
```

---

## 🔧 Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (`node -v`)
- **npm**: v9.0.0 or later (`npm -v`)
- **MongoDB**: Community Server installed and running locally on port 27017 (`mongod`)

### 2. Clone or Open the Workspace
```bash
cd /Users/dharshinias/Desktop/fsd
```

### 3. Install Dependencies
Run the install command for both backend and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

---

## 🛢️ MongoDB Setup & Seeding

1. Ensure the MongoDB service is running:
   - On macOS (via Homebrew):
     ```bash
     brew services start mongodb-community
     # or run directly:
     mongod --config /opt/homebrew/etc/mongod.conf
     ```
2. Populate the database with test accounts, baseline history, and initial demo transactions:
   ```bash
   cd backend
   npm run seed
   ```
   *Output confirmation:*
   ```text
   [Seeder] Connected to MongoDB database...
   [Seeder] Test Accounts Created:
     👑 Admin:    admin@frauddetection.com / Admin@12345
     👤 Customer: customer@example.com / Customer@12345
   [Seeder] 3 Baseline Historical Transactions created (Avg ~₹2,500).
   [Seeder] Sample Demonstration Transactions & Alerts created (1 MEDIUM, 1 HIGH).
   [Seeder] Database seeding completed successfully! ✨
   ```

---

## 🚀 Running the Application

### Option A: Separate Terminals (Recommended for Development)

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Test Credentials

| Role | Email Address | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@frauddetection.com` | `Admin@12345` | Real-time monitoring, approving, blocking transactions |
| **Customer** | `customer@example.com` | `Customer@12345` | Submitting test transactions, viewing personal account |

*(Tip: Both demo credentials can be filled with 1 click on the Login page using the "Admin Demo" and "Customer Demo" buttons).*

---

## 🧪 How to Test Fraud Detection Rules

When logged in as **Customer**, click **"Send Money"** in the sidebar. You will see three test buttons at the top:

### 1. LOW Risk Test Scenario (Auto-Approved)
- **Inputs:** Amount: `₹2,200`, Beneficiary: `ACC-SBI-1001`, Device: `DEV-MAC-CHROME-01`, Location: `Mumbai, India`.
- **Rules Evaluated:** None triggered. Matches historical baseline.
- **Score:** `0 / 100` $\rightarrow$ **LOW Risk**.
- **Result:** Status set to **`APPROVED`**.

### 2. MEDIUM Risk Test Scenario (Held for Review)
- **Inputs:** Amount: `₹48,000`, Beneficiary: `ACC-ICICI-8888`, Device: `DEV-WIN-EDGE-02`, Location: `Mumbai, India`.
- **Rules Triggered:**
  - Rule 1: Unusual Amount (+25 pts)
  - Rule 3: New Beneficiary (+20 pts)
  - Rule 4: Unrecognized Device (+15 pts)
- **Score:** `60 / 100` $\rightarrow$ **MEDIUM Risk**.
- **Result:** Status set to **`REVIEW`**. Alert generated and pushed to Admin.

### 3. HIGH Risk Test Scenario (Auto-Blocked)
- **Inputs:** Amount: `₹1,35,000`, Beneficiary: `OFFSHORE-9999-SWIFT`, Device: `DEV-LINUX-OPERA-03`, Location: `Moscow, Russia`.
- **Rules Triggered:**
  - Rule 1: Unusual Amount (+25 pts)
  - Rule 2: Rapid Repeated Frequency (+20 pts)
  - Rule 3: New Beneficiary (+20 pts)
  - Rule 4: Unrecognized Device (+15 pts)
  - Rule 5: Unusual Location (+10 pts)
- **Score:** `90 / 100` $\rightarrow$ **HIGH Risk**.
- **Result:** Status set to **`BLOCKED`**. Real-time alert dispatched to Admin via Socket.IO.

---

## ⚡ Testing Real-Time Alerts via Socket.IO

1. Open two separate browser windows (or an Incognito window):
   - **Window 1:** Log in as **Admin** (`admin@frauddetection.com`) $\rightarrow$ go to `/admin`.
   - **Window 2:** Log in as **Customer** (`customer@example.com`) $\rightarrow$ go to `/create-transaction`.
2. In Window 2, click **"🔴 Test HIGH Risk (Blocked)"** and submit the transaction.
3. Observe **Window 1 (Admin)**:
   - An alert banner **immediately slides down** at the top with an audio chime:
     *`🚨 REAL-TIME FRAUD ALERT DETECTED — HIGH RISK (90/100) — TXN...`*
   - The **Pending Alerts** counter increments from $N$ to $N+1$ without refreshing the browser.
   - The transaction appears directly at the top of the **Real-Time Transaction Stream**.
   - Admin can click **"Investigate"** or **"Block Immediately"**.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/profile` — Get authenticated user details
- `PUT /api/auth/profile` — Update name, phone, or password

### Transactions (`/api/transactions`)
- `POST /api/transactions` — Create, evaluate against rules, and persist a transaction
- `GET /api/transactions` — Retrieve customer's transactions (supports `search`, `status`, `riskLevel`)
- `GET /api/transactions/:id` — Retrieve transaction details and rule breakdown

### Admin Compliance (`/api/admin`)
- `GET /api/admin/dashboard` — Summary metrics and recent alert activity
- `GET /api/admin/transactions` — View all transactions with advanced filtering
- `GET /api/admin/alerts` — View all alerts with status and risk filters
- `PUT /api/admin/transactions/:id/approve` — Manually override and approve a held transaction
- `PUT /api/admin/transactions/:id/block` — Manually block a flagged transaction
- `PUT /api/admin/alerts/:id/review` — Mark alert status as `REVIEWED` or `RESOLVED`

---

## ❓ Troubleshooting Common Issues

1. **MongoDB Connection Failed (`ECONNREFUSED 127.0.0.1:27017`)**:
   - Ensure the MongoDB server daemon is running:
     ```bash
     brew services start mongodb-community
     ```
2. **Socket.IO Not Connecting**:
   - Verify backend is running on `http://localhost:5000` and frontend on `http://localhost:5173`.
   - Ensure `CLIENT_URL=http://localhost:5173` is configured in `backend/.env`.
3. **Port 5000 Already in Use**:
   - On macOS, AirPlay Receiver sometimes occupies port 5000. Disable AirPlay Receiver in *System Settings > General > AirDrop & Handoff*, or change `PORT=5001` in `backend/.env`.

---

## 🔮 Future Enhancements
- **Machine Learning Integration:** Train an XGBoost or Random Forest classifier on historical transaction embeddings as a secondary validation layer.
- **Biometric Authentication:** WebAuthn integration for biometric multi-factor authentication (FaceID / Fingerprint) when risk score exceeds 40.
- **Geographic Geo-Fencing:** IP-to-Geo velocity tracking checking physical travel plausibility between subsequent transactions.
- **Automated SMS & Email OTP:** Trigger temporary OTP verification challenges before blocking medium-risk transactions.

---

## 📜 Academic Declaration
This project is developed as an academic full-stack project demonstrating deterministic security engineering, transaction auditing, and real-time event broadcasting using the MERN stack.
