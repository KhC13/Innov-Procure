# 🚀 InnovProcure
 
### *Bridging Government Needs with Startup Innovation*
 
> From Government Problem to Proven Startup Solution — **Discover · Evaluate · Pilot · Procure · Scale**
 
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://innovprocure-y0ob.onrender.com)
[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange?style=for-the-badge)](#)
![React](https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
 
**🌐 Live Demo:** [https://innovprocure-y0ob.onrender.com](https://innovprocure-y0ob.onrender.com)
 
---
 
## 📖 About the Project
 
Great innovations often exist, but the right opportunities don't always find them.
 
**InnovProcure** is a unified digital platform that enables Government Departments to **discover, evaluate, pilot and procure** innovative startup solutions through a transparent and outcome-driven workflow. From discovering the right ideas to enabling real-world pilots, we turn innovation into impact.
 
Built by **Team DoraX** for **Smart India Hackathon 2026** (Problem Statement 26136 — Startup-Friendly Public Procurement).
 
---
 
## ❗ Problem Statement
 
Government departments struggle to efficiently identify, evaluate, pilot, procure and scale innovative solutions developed by eligible startups.
 
| Problem | Description |
|---|---|
| **Fragmented Discovery** | Innovative startups and relevant government needs are difficult to connect |
| **Complex Procurement** | Traditional procurement is hard for early-stage startups to navigate |
| **Limited Piloting** | No structured mechanism to test solutions before large-scale adoption |
| **Evaluation Gaps** | No unified framework to compare innovation, feasibility, impact and technical capability |
| **Scalability Barrier** | Successful pilots lack a clear pathway to procurement and wider deployment |
| **Issue Resolution** | No transparent system for reporting, tracking and resolving implementation issues |
 
**Core Challenge:** How can we create a transparent, startup-friendly mechanism that moves government departments from **Need → Discover → Evaluate → Pilot → Procure → Scale**, while ensuring efficient issue reporting and resolution?
 
---
 
## 💡 Our Solution
 
InnovProcure provides an end-to-end, outcome-driven innovation procurement workflow:
 
```
Government Challenge → Discovery & Eligibility → Expert Evaluation & Scoring
        → Pilot Sandbox → Milestone-based Procurement → Impact Validation → Scale Across Departments
```
 
---
 
## ✨ Key Features
 
- 🎯 **Outcome-based Challenges** — requirements, KPIs and criteria defined up front
- 🔍 **Startup Discovery** — registration, challenge matching and proposal submission
- 🔄 **End-to-End Workflow** — Screening → Evaluation → Pilot → Procurement → Scale
- 🧪 **Pilot Management** — milestones, KPIs, timelines and payments
- 👁️ **Transparency** — role-based dashboards, real-time notifications and audit trails
- 🤖 **AI-Assisted Matching** — intelligent startup–challenge recommendations (semantic search)
- 🔐 **Role-Based Access Control** — Government / Startup / Evaluator / Procurement Officer / Admin
### 👥 User Roles
 
| Role | Responsibility |
|---|---|
| **Government Department** | Create challenges, evaluate and procure |
| **Startup** | Discover challenges and submit solutions |
| **Evaluator** | Assess proposals and pilot performance |
| **Procurement Officer** | Manage contracts, milestones and payments |
| **Admin** | Manage users, workflows and platform |
 
---
 
## 🏗️ Architecture
 
```
┌──────────────────────────────────────────────────────────┐
│   Government Dept · Startup · Evaluator · PO · Admin     │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│            React Frontend (Web Application)              │
└──────────────────────────┬───────────────────────────────┘
                           │  REST APIs
┌──────────────────────────▼───────────────────────────────┐
│     Node.js + Express (Business Logic, JWT + RBAC)       │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
┌───────────────▼──────────┐   ┌───────────▼───────────────┐
│   PostgreSQL Database    │   │ AI Matching & Recommend.  │
│                          │   │ Layer (Semantic Search)   │
└──────────────────────────┘   └───────────────────────────┘
```
 
---
 
## 🛠️ Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT + RBAC |
| Communication | REST APIs |
| AI / Matching | Semantic Matching *(advanced phase)* |
| Version Control | Git & GitHub |
| Deployment | Render |
 
---
 
## 📊 Project Presentation (PPT)
 
📥 **[Download the full presentation (PDF)](docs/InnovProcure_PPT.pdf)**
 

 
## 📸 Screenshots
 

 
| Home | Dashboard | Pilot Tracking |
|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Pilot](docs/screenshots/pilot.png) |
 
---
 
## ⚙️ Quick Setup
 
### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Git
### Installation
 
```bash
# 1. Clone the repository
git clone https://github.com/yash616257201-ux/InnovProcure.git
cd InnovProcure
 
# 2. Install backend dependencies
cd backend
npm install
 
# 3. Install frontend dependencies
cd ../frontend
npm install
```
 
### Environment Variables
 
Create a `.env` file in the backend folder:
 
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/innovprocure
JWT_SECRET=your_jwt_secret
```
 
### Run Locally
 
```bash
# Start backend
cd backend
npm start
 
# Start frontend (new terminal)
cd frontend
npm start
```
 
> ⚠️ Adjust folder names and scripts above to match your actual repo structure.
 
---
 
## 👨‍💻 Team DoraX
 
**Bhagwan Parshuram Institute of Technology**
 
| Member | Responsibility |
|---|---|
| **Khushi Chhakara** | Backend & Databases |
| **Kanishka Sharma** | Frontend Optimization |
| **Yash Kumar** | Frontend Advancement & Deployment |
 
### 🤝 Individual Contributions
 
#### 👩‍💻 Khushi Chhakara — Backend & Databases
- Designed and built the Node.js + Express REST APIs
- Designed the PostgreSQL schema and relationships (challenges, startups, proposals, pilots, milestones)
- Implemented JWT authentication and role-based access control (RBAC)
- Built the business logic for the challenge-to-procurement workflow
#### 👩‍💻 Kanishka Sharma — Frontend Optimization
- Optimized the React frontend for performance, responsiveness and a consistent UI
- Improved component structure, reusability and page load experience
- Refined user flows and dashboards for a smoother experience across roles
- Fixed UI bugs and improved overall usability
#### 👨‍💻 Yash Kumar — Frontend Advancement & Deployment
- Developed advanced frontend features and role-based dashboards
- Integrated the frontend with backend REST APIs
- Deployed the application on Render ([live link](https://innovprocure-y0ob.onrender.com))
- Managed the GitHub repository and version control
---
 
## 🌍 Impact & Benefits
 
- **Government:** faster discovery of startups, reduced procurement risk, evidence-based decisions
- **Startups:** better visibility, fairer evaluation, clear pilot-to-procurement pathway
- **Citizens:** better public services and transparent, accountable outcomes
- **Environmental:** digital workflows reduce paper use and carbon footprint
> The opportunity is not to replace GeM — it is to build the missing innovation layer before and around procurement.
 
---
 
## 📚 Documentation
 
| Document | Description |
|---|---|
| [Presentation (PDF)](docs/InnovProcure_PPT.pdf) | Full SIH 2026 project presentation |
 
 
---
 
## 🔗 References
 
- Smart India Hackathon 2026 — Problem Statement 26136
- Startup India — Public Procurement / GeM Startup Runway
- Maharashtra State Startup Policy
- Maharashtra Startup Week (Govt. of Maharashtra)
- DPIIT
- Press Information Bureau (GeM & SWAYATT, 2026)
---
 
<p align="center">Made with ❤️ by <b>Team DoraX</b> for Smart India Hackathon 2026</p>
 
