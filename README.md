# CSIT321-G4-EDU-RENT

Edu-rent is campus wide E-commerce website. For Students looking to rent, sell, and buy items from other fellow Students. Eliminating the need to look for sellers that are too far away or arent compliant. And Students won't have to go through different platforms to find what they need. 

Getting Started 🚀
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites 🔧
Make sure you have the following software installed on your system:

-Java Development Kit (JDK): Version 17 or later.

-Apache Maven: To build and run the backend.

-Node.js and npm: To run the frontend.

-MySQL Server: Or another MySQL-compatible database.

Git: For version control.

Installation & Setup 📦
Clone the repository to your local machine (in your local disk C or in your desktop):

when you are in your folder right click and open Git Bash here and type:

git clone https://github.com/YourUsername/CSIT321-G4-EDU-RENT.git

(Remember to replace YourUsername with your actual GitHub username.)

Set up the database:

-Open your MySQL client (like MySQL Workbench).

-Create a new database for the project:

-SQL

-CREATE DATABASE edu_rent_db;

Configure the backend connection:

-Navigate to the backend's configuration file at edurentbackend/src/main/resources/application.properties.

-Update the database username and password to match your local MySQL credentials:

Properties

-spring.datasource.username=your_mysql_username

-spring.datasource.password=your_mysql_password

How to Run the Project

You will need to run two separate processes in two separate terminals: one for the backend and one for the frontend.

1. Run the Backend (Spring Boot)
Open a terminal and navigate to the backend directory:

Bash

cd edurentbackend
Run the application using Maven:

Bash

mvn spring-boot:run
The backend server will start and be available at http://localhost:8080.

2. Run the Frontend (React)
Open a new terminal and navigate to the frontend directory:

Bash

cd edurentfrontend
Install the necessary project dependencies:

Bash

npm install
Start the React development server:

Bash

npm start
Your browser will automatically open to http://localhost:3000, and you can now use the application.
