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
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [How to Run the Project](#-how-to-run-the-project)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Team Members](#-team-members)
- [License](#-license)
- [Deployment](#-deployment)
-----

## 🌟 Overview
Edu-Rent is a campus-based e-commerce platform where students can rent, sell, and buy items from fellow students. It eliminates the need to use multiple platforms or deal with distant or unreliable sellers. Everything happens within the school community, ensuring convenience, accessibility, and trust.
-----

## 🎯 Purpose
The purpose of Edu-Rent is to:
- Provide a centralized marketplace for students
- Improve accessibility to needed items on campus
- Simplify renting, selling, and buying
- Promote student-to-student trust and convenience
-----

## ✨ Features
### 🧑‍🎓 Student Marketplace
- Browse available items
- Rent, buy, or sell products
- Upload item listings with images and descriptions

### 🔐 Account & Profile Management
- Register/Login
- Manage personal listings
- View rental or purchase history

### 📊 Admin Dashboard (Future Scope)
- Approve suspicious listings
- Manage users and transactions

### 🔎 Search & Filter
- Search items by category, price, or availability
-----

## 🛠 Tech Stack
*Backend*  
- Java Spring Boot  
- Maven  
- RESTful APIs  

*Frontend*  
- React  
- Node.js  
- npm  

*Database*  
- MySQL (or compatible)

*Version Control*  
- Git & GitHub
-----

## 📋 Prerequisites
Before running the project, make sure you have:
- Java Development Kit (JDK 17+)
- Apache Maven
- Node.js & npm
- MySQL Server
- Git
-----

## ⚙️ Setup & Installation
### ✅ Step 1: Clone the Repository
    git clone https://github.com/YourUsername/CSIT321-G4-EDU-RENT.git
Replace `YourUsername` with your GitHub username.


### ✅ Step 2: Create the Database
    CREATE DATABASE edu_rent_db;

### ✅ Step 3: Configure Backend Database
Navigate to:  
edurentbackend/src/main/resources/application.properties  
Update credentials:
    spring.datasource.username=your_mysql_username
    spring.datasource.password=your_mysql_password
-----

## ▶️ How to Run the Project
You will run two terminals: one for the backend and one for the frontend.

### ✅ 1. Run the Backend (Spring Boot)
    cd edurentbackend
    mvn spring-boot:run
Backend runs at: http://localhost:8080

### ✅ 2. Run the Frontend (React)
    cd edurentfrontend
    npm install
If vulnerabilities appear, you may ignore them during development.


Start the frontend:
    npm install
    npm start
Frontend runs at: http://localhost:3000
-----

## 🧪 Usage Guide
1. Open your browser  
2. Visit http://localhost:3000  
3. Register or log in  
4. Browse, add, rent, sell, or buy items  
-----

## 📁 Project Structure
    CSIT321-G4-EDU-RENT/
    │
    ├── edurentbackend/        # Spring Boot backend
    │   └── src/main/java/
    │   └── src/main/resources/
    │
    ├── edurentfrontend/       # React frontend
    │   └── src/
    │
    └── README.md
-----

## 👥 Team Members
| Name | Role |
|------|------|
| *Theo Cedric Chan* |  Developer |
| *Andre Codilla* |  Developer |
| *Ken Patrick Ranis* |  Developer |
-----

## 📄 License
This project is licensed under the *MIT License*.  
You are free to use, modify, and distribute with proper credit.
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
