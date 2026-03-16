# 🛒 CSIT321-G4-EDU-RENT / Edu-Rent
<div align="center">
  <h3>A Campus-Wide E-Commerce Platform for Students</h3>
  <p>Rent, Sell, and Buy Items Easily Within Your School Community</p>
</div> 

-----

## 📖 Table of Contents
- [Overview](#-overview)
- [Purpose](#-purpose)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [How to Run the Project](#-how-to-run-the-project)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Team Members](#-team-members)
- [License](#-license)
- [Deployment](#-deployment)

-----

## 🌟 Overview
Edu-Rent is a full-stack, campus-based e-commerce platform where students can rent, sell, and buy items from fellow students. It eliminates the need to use multiple platforms or deal with distant or unreliable sellers. Everything happens within the school community, ensuring convenience, accessibility, and trust.

The platform features real-time messaging between buyers and sellers, a notification system, user ratings and reviews, image uploads via Cloudinary, and JWT-based authentication.

## 🎯 Purpose
The purpose of Edu-Rent is to:
- Provide a centralized marketplace for students
- Improve accessibility to needed items on campus
- Simplify renting, selling, and buying
- Promote student-to-student trust and convenience
- Enable real-time communication between campus community members

## ✨ Features
### 🧑‍🎓 Student Marketplace
- Browse available items for rent or for sale
- Rent, buy, or sell products within the campus community
- Upload item listings with multiple images and descriptions
- Category-based browsing and filtering
- Infinite scroll pagination for seamless browsing

### 🔐 Account & Profile Management
- Register/Login with JWT authentication
- OTP-based email verification
- Password reset via email tokens
- Manage personal listings (create, edit, mark as sold)
- View rental or purchase transaction history
- User profiles with ratings and reviews

### 💬 Real-Time Messaging
- WebSocket-based chat between buyers and sellers (SockJS/StompJS)
- Send and receive messages with image attachments
- Conversation management per listing

### 🔔 Notifications
- Real-time in-app notifications
- Notification preferences management

### ❤️ Social Features
- Like/Unlike listings
- Leave reviews and star ratings for other users
- View user reputation scores

### 🔎 Search & Filter
- Search items by category, price, or availability
- Sidebar filters for refined browsing

### 📊 Admin Dashboard (Future Scope)
- Approve suspicious listings
- Manage users and transactions

-----

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Java 21 + Spring Boot 3 | Core backend framework |
| Spring Security + JWT | Authentication & authorization |
| Spring Data JPA + Hibernate | ORM and database access |
| Spring WebSocket (SockJS/StompJS) | Real-time messaging |
| Spring Mail | Email notifications & password reset |
| Spring Cache + Caffeine | Server-side caching |
| Cloudinary | Image hosting and management |
| Apache Maven | Build and dependency management |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| TailwindCSS 4 | Utility-first styling |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP API communication |
| SockJS + StompJS | WebSocket client for real-time chat |
| Supabase JS | Real-time database subscriptions |
| DOMPurify | XSS prevention |
| Browser Image Compression | Client-side image optimization |

### Database & Cloud
| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL) | Primary database (AWS ap-south-1) |
| Cloudinary | Image storage and CDN |
| Gmail SMTP | Transactional email delivery |

*Version Control*  
- Git & GitHub

-----

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  Pages → Components → Services → Axios / WebSocket Client    │
│               ↕                           ↕                  │
│         React Context              Supabase JS Client         │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼───────────────────────────────────┐
│               Backend (Spring Boot REST API)                  │
│   Controllers → Services → Repositories → PostgreSQL (Supabase) │
│        ↕              ↕                                       │
│  JWT Security    Cloudinary / Gmail SMTP                      │
└──────────────────────────────────────────────────────────────┘
```

-----

## 📋 Prerequisites
Before running the project, make sure you have:
- Java Development Kit (JDK 21+)
- Apache Maven
- Node.js & npm
- A Supabase project (PostgreSQL database)
- A Cloudinary account (for image uploads)
- A Gmail account with an app password (for email delivery)

-----

## 🔑 Environment Variables
The backend requires the following environment variables. Create a `.env` file inside `edurentbackend/` (see `run_dev.ps1` for reference):

```env
DB_PASSWORD=<supabase-database-password>
JWT_SECRET=<your-jwt-secret-key>
MAIL_PASSWORD=<gmail-app-password>
SUPABASE_ANON_KEY=<supabase-anonymous-key>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
```

> ⚠️ Never commit your `.env` file to version control.

-----

## ⚙️ Setup & Installation

### 📌 **Option 1: How to Contribute to the Edu-Rent Project**
#### This guide outlines the step-by-step process for contributing code to the project. We use a "Fork and Pull Request" model to maintain code quality and a clean history.

### Branch Naming Pattern
#### To keep our work organized, please follow this pattern for all new branches:
#### type/short-description
 - type: Describes the kind of change you are making.
 - feat: For a new feature (e.g., feat/student-profile-page).
 - fix: For a bug fix (e.g., fix/login-password-mismatch).
 - docs: For changes to documentation (e.g., docs/update-readme).
 - style: For code style changes that don't affect logic (e.g., style/reformat-css-files).
 - refactor: For code changes that neither fix a bug nor add a feature (e.g., refactor/simplify-view-logic).
 - short-description: A few words separated by hyphens that summarize the change.

----

## Part 1: One-Time Setup
#### You only need to do this once at the beginning.

#### Step 1: Fork the Repository
 - First, you need to create your own personal copy of the main project repository on GitHub.
 - Navigate to the main repository URL: https://github.com/theo2815/CSIT321-G4-EDU-RENT
 - In the top-right corner of the page, click the Fork button.
 - This will create a new repository under your own GitHub account
   (https://github.com/your-username/CSIT321-G4-EDU-RENT). This is your personal fork.

----

### Step 2: Clone Your Fork to Your Computer
#### Now, download the code from your personal fork to your local machine.
1. On your fork's GitHub page, click the green < > Code button.
2. Copy the HTTPS URL provided.
3. Open your terminal or Git Bash and run the following command, replacing the URL with the one you just copied:
```bash
git clone https://github.com/your-username/CSIT321-G4-EDU-RENT.git
```
4. Navigate into the newly created project folder:
```bash
cd CSIT321-G4-EDU-RENT
```
----

### Step 3: Configure Remotes
#### You need to tell your local repository about the original "upstream" project so you can keep your fork updated with the team's latest changes.
1. Your fork is already configured as the origin remote. You can verify this by running git remote -v.

2. Now, add the original project repository as a new remote called upstream
```bash
git remote add upstream https://github.com/theo2815/CSIT321-G4-EDU-RENT.git
```
3. Verify that you now have two remotes (origin and upstream) by runnin
```bash
git remote -v
```
----

## Part 2: The Development Workflow
#### Follow these steps every time you want to start a new feature or bug fix.

### Step 1: Sync Your Fork
#### Before you start writing any new code, you must update your fork with the latest changes from the main project.
1. Make sure you are on your local main branch:
```bash
git checkout main
```

2. "Pull" the latest changes from the original (upstream) project into your local main branch:
```bash
git pull upstream main
```

3. Push these updates to your personal fork on GitHub (origin) to keep it in sync:
```bash
git push origin main
```

----

### Step 2: Create a New Branch
#### Never work directly on the main branch. Always create a new, descriptive branch for your task.
1. Create and switch to your new branch, following the naming pattern:
```bash
# Example for a new feature:
git checkout -b feat/add-shopping-cart
```

----

### Step 3: Write Your Code
#### This is where you do your work: add features, fix bugs, and make any other changes.

### Step 4: Commit Your Changes
#### Save your work to the branch's history.
1. Stage all your changed files:
```bash
git add .
```
2. Commit the changes with a clear, descriptive message:
```bash
git commit -m "Feat: Add shopping cart functionality to browse all product"
```

----

### Step 5: Push Your Branch to Your Fork
#### Upload your new branch and its commits to your personal fork on GitHub.
```bash
git push -u origin feat/add-shopping-cart
```
----

### Step 6: Create a Pull Request (PR)
#### The final step is to propose your changes to the main project.

1. Go to your fork's page on GitHub (https://github.com/your-username/CSIT321-G4-EDU-RENT).
2. GitHub will automatically detect your newly pushed branch and show a green button that says "Compare & pull request." Click it.
3. Give your pull request a clear title and a brief description of the changes you made.
4. Click the "Create pull request" button.

##### Your work is now submitted for review! The project lead can now review your code, suggest changes, and merge it into the main project.

-----

### 📌 **Option 2: Just Using the Project (Direct Clone)**

If you just want to use the application:
```bash
# Clone the repository directly
git clone https://github.com/theo2815/CSIT321-G4-EDU-RENT.git

# Navigate to the project directory
cd CSIT321-G4-EDU-RENT

```

-----

## ▶️ How to Run the Project
You will run two terminals: one for the backend and one for the frontend.

### ✅ 1. Run the Backend (Spring Boot)
```bash
cd edurentbackend
```

```bash
    mvn spring-boot:run
```

Backend runs at: http://localhost:8080

### ✅ 2. Run the Frontend (React)
```bash
cd edurentfrontend
```

```bash
npm install
```

Start the frontend:
```bash
npm run dev
```

Frontend runs at: http://localhost:5173

-----

## 🧪 Usage Guide
1. Open your browser  
2. Visit http://localhost:5173/login 
3. Register or log in  
4. Browse, add, rent, sell, or buy items  

-----

## 📁 Project Structure
```
CSIT321-G4-EDU-RENT/
│
├── edurentbackend/              # Spring Boot REST API Backend (Java 21)
│   ├── src/main/java/com/edurent/crc/
│   │   ├── controller/          # REST API endpoint controllers
│   │   ├── service/             # Business logic layer
│   │   ├── entity/              # JPA database entity models
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── config/              # Spring configuration (CORS, WebSocket, etc.)
│   │   ├── security/            # JWT authentication & Spring Security
│   │   ├── mapper/              # Entity ↔ DTO mappers
│   │   └── exception/           # Global exception handling
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── run_dev.ps1              # Windows dev startup script (loads .env)
│
├── edurentfrontend/             # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   └── auth/            # Authentication-related components
│   │   ├── pages/               # Full page-level route components
│   │   ├── context/             # React Context for global state
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Axios API service functions
│   │   ├── utils/               # Utility/helper functions
│   │   ├── assets/              # Images and static assets
│   │   ├── App.jsx              # Root app component with routing
│   │   ├── main.jsx             # Application entry point
│   │   └── supabaseClient.js    # Supabase real-time client setup
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

-----

## 👥 Team Members
| Name | Role |
|------|------|
| *Theo Cedric Chan* |  Developer |
| *Andre Codilla* |  Developer |
| *Ken Patrick Ranis* |  Developer |

-----

## 🌐 Deployment
### 🚧 Status: In Development
This project is currently intended for local development. Deployment steps will be added later.

-----

<div align="center">
  <p>Made with ❤️ by the Edu-Rent Team</p>
  <p>© 2025 Edu-Rent. All rights reserved.</p>
  <br>
  <a href="#-csit321-g4-edu-rent--edu-rent">Back to Top ⬆️</a>
</div>




