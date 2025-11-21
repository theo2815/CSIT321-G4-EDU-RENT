# 🛒 Edu-Rent (CSIT321-G4-EDU-RENT)

Edu-Rent is a campus-wide marketplace where students can rent, buy, and sell items within their school community. This repository contains a Java Spring Boot backend and a React + Vite frontend alongside configuration and instructions to run and contribute.

-----

**Table of Contents**
- **Overview**: What the project does
- **Tech Stack**: Key technologies used
- **Prerequisites**: What you need locally
- **Quick Start**: Run backend and frontend locally
- **Environment / Config**: Keys and properties
- **Build & Test**: Build artifacts and run tests
- **Project Structure**: Where code lives
- **Contributing**: Branching and workflow
- **Team** & **License**

-----

**Overview**
- Edu-Rent provides a simple, local student marketplace (listings, images, messaging, likes, reviews, transactions). The backend exposes REST APIs and the frontend is a single-page React app that consumes those APIs.

**Primary goals**
- Simple local marketplace for students
- Secure authentication & user profiles
- Upload/list images and manage listings
- Conversations and notifications between users

-----

**Tech Stack**
- **Backend:** Java 17+, Spring Boot, Maven
- **Frontend:** React, Vite, Node.js, npm
- **Database / Auth:** Supabase (Postgres + Auth)
- **Version control:** Git / GitHub

-----

**Prerequisites**
- JDK 17 or newer
- Maven (or use the included wrapper)
- Node.js (16+) and npm
- Git
- Supabase project (for production-like local testing)

-----

**Quick Start (recommended)**
Open two terminals (one for backend, one for frontend).

- Backend (Windows cmd example using included Maven wrapper):

```cmd
cd edurentbackend
mvnw.cmd spring-boot:run
```

The backend will run by default on `http://localhost:8080` (see `edurentbackend/src/main/resources/application.properties`).

- Frontend:

```cmd
cd edurentfrontend
npm install
npm run dev
```

Frontend (Vite) runs by default at `http://localhost:5173`.

Open `http://localhost:5173` and use the app. API calls target the backend (CORS must be enabled in the backend configuration; see `WebConfig.java`).

-----

**Environment / Configuration**

- Backend: edit `edurentbackend/src/main/resources/application.properties` to configure database URL, username/password, JWT settings, and Supabase if used. Typical keys to update:

    - `spring.datasource.url`
    - `spring.datasource.username`
    - `spring.datasource.password`
    - `spring.jpa.hibernate.ddl-auto` (dev: update)

- Frontend: place environment values in `edurentfrontend/.env` (Vite expects `VITE_` prefix). Create a file `edurentfrontend/.env` with:

```
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_BASE_URL=http://localhost:8080
```

Replace values with your Supabase project credentials and backend URL. The frontend uses `supabaseClient.js` and `services/apiService.js` to read these.

-----

**Build & Test**

- Backend build and tests (Windows):

```cmd
cd edurentbackend
mvnw.cmd test        :: run unit tests
mvnw.cmd package     :: builds the application jar in target/
```

To run the packaged jar after build:

```cmd
cd edurentbackend\target
java -jar crc-0.0.1-SNAPSHOT.jar
```

- Frontend build:

```cmd
cd edurentfrontend
npm run build
```

The built frontend will be in `edurentfrontend/dist` (Vite default).

-----

**Project structure (top-level)**

```
CSIT321-G4-EDU-RENT/
├─ edurentbackend/         # Spring Boot backend
│  ├─ pom.xml
│  └─ src/main/java/...    # controllers, services, entities, repositories
│  └─ src/main/resources/application.properties
├─ edurentfrontend/        # React + Vite frontend
│  ├─ package.json
│  └─ src/                 # components, pages, hooks, services, static CSS
├─ uploads/                # listing images (dev/test)
└─ README.md               # this file
```

Important files to inspect:
- `edurentbackend/src/main/java/com/edurent/crc/controller` — REST controllers
- `edurentbackend/src/main/resources/application.properties` — backend config
- `edurentfrontend/src/supabaseClient.js` — Supabase init
- `edurentfrontend/src/services/apiService.js` — API wrapper for frontend

-----

**Contributing**

Follow the Fork → Branch → PR workflow. Keep branches short and focused.

- Branch naming (examples):
    - `feat/<short-description>` for new features
    - `fix/<short-description>` for bug fixes
    - `docs/<short-description>` for documentation

- Typical workflow:

```cmd
# sync with upstream
git checkout main
git pull upstream main

# create feature branch
git checkout -b feat/add-some-endpoint

# make changes, then
git add .
git commit -m "Feat: Add X feature"
git push -u origin feat/add-some-endpoint
```

Open a Pull Request from your branch to `main` and request reviews.

-----

**API & Auth notes**

- The backend uses JWT-based authentication and exposes endpoints grouped by responsibility (users, listings, messages, notifications, etc.). See the `controller` package in the backend for route mappings and example request/response DTOs.
- CORS and web configuration are in `WebConfig.java` and security configuration is in `SecurityConfig.java`.

-----

**Troubleshooting**

- If frontend can't reach the backend, confirm `VITE_API_BASE_URL` and backend port. Also ensure CORS is enabled.
- If database errors occur, ensure the `spring.datasource.*` properties are correct and the DB is reachable.

-----

**Team**
- Theo Cedric Chan — Developer
- Andre Codilla — Developer
- Ken Patrick Ranis — Developer

-----

**License & Copyright**
- © 2025 Edu-Rent. All rights reserved. (Adjust or add an open-source license if desired)

-----

If you want, I can also:
- Add an example `edurentfrontend/.env.example` and `edurentbackend/.env.example` with the minimal variables.
- Add a `docker-compose.yml` to run Postgres + backend + frontend locally.

Would you like me to add any of those now? 
