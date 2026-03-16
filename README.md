<<<<<<< ours
# TutorBuddy - AI Study Companion

TutorBuddy is an intelligent study companion designed for university students. It helps you manage courses, generate AI-powered quizzes from lecture notes, track your study progress, and provides adaptive feedback on your performance.

## 🚀 Project Structure

The project is split into three main services:

- **Frontend**: Next.js application (React, TailwindCSS, Framer Motion)
- **Backend**: Express.js server (TypeScript, Node.js)
- **AI Service**: Python FastAPI service (NLTK, PyPDF2, OCR)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: (v18 or higher)
- **Python**: (v3.10 or higher)
- **Tesseract OCR**: (Required for handwritten note scanning)
  - [Install Tesseract on Windows](https://github.com/UB-Mannheim/tesseract/wiki)
  - [Install Tesseract on Ubuntu](https://tesseract-ocr.github.io/tessdoc/Installation.html)
- **Appwrite Account**: For authentication and database.

---

## 📥 Installation

Follow these steps to set up the project locally:

### 1. Clone the repository
```bash
git clone https://github.com/Munachimso-DataScience/tutobuddy.git
cd tutobuddy
```

### 2. Install all dependencies
You can use the convenience script in the root directory:
```bash
npm run install-all
```
*Note: This installs Node.js dependencies for the root, backend, and frontend.*

### 3. Set up the Database (Appwrite)
1. Fill in your `.env` file in the `backend` folder with your Appwrite project details.
2. Initialize the database collections and attributes:
```bash
npm run setup-db
```

### 4. Set up the AI Service (Python)
Navigate to the `ai-services` directory and set up a virtual environment:
```bash
cd ai-services
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m nltk.downloader wordnet omw-1.4 punkt averaged_perceptron_tagger
```

---

## ⚙️ Environment Variables

You need to set up `.env` files for each service.

### Backend (`/backend/.env`)
Create a `.env` file in the `backend` folder:
```env
PORT=5000
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_id
APPWRITE_API_KEY=your_key
APPWRITE_DATABASE_ID=your_id
APPWRITE_COLLECTION_COURSES=your_id
APPWRITE_COLLECTION_MATERIALS=your_id
APPWRITE_COLLECTION_QUIZZES=your_id
APPWRITE_COLLECTION_ACTIVITY=your_id
APPWRITE_COLLECTION_TASKS=your_id
APPWRITE_COLLECTION_SCHEDULE=your_id
APPWRITE_COLLECTION_USERS=your_id
```

### Frontend (`/frontend/.env.local`)
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_id
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_URL=http://localhost:8000
```

---

## 🏃 Running the Application

You can start all three services simultaneously from the root directory:

```bash
npm run dev
```

This will launch:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000

---

## 📱 Mobile Preview
To test on mobile while running locally:
1. Ensure your phone and computer are on the same Wi-Fi.
2. Update `NEXT_PUBLIC_API_URL` to use your computer's IP address (e.g., `http://192.168.1.5:5000`).
3. Access the app via `http://your-ip-address:3000`.

---

## 📜 License
This project is licensed under the ISC License.
=======
# Development of a Student Companion System

## Project Title
Development of a Student Companion System

## Tech Stack
- React (Vite)
- Appwrite (Authentication, Database, Storage)

## Introduction
Students in tertiary institutions encounter a variety of challenges related to academic planning, time management, communication, and resource accessibility. The increasing adoption of mobile technologies presents the opportunity to create a unified platform that acts as a digital personal assistant to the student.

A Student Companion System is a digital solution designed to support students in managing their academic and personal activities effectively. This project focuses on designing and developing a user-friendly Student Companion System that combines key functionalities such as timetable management, assignment tracking, study reminders, resource access, and communication support. The system aims to serve as a reliable digital assistant that enhances student learning experiences.

Development of a student companion system is not just a tool for communication; it represents a step toward an integrated campus digital ecosystem. It reflects the aspirations of a generation that is deeply connected to technology and demands convenience, speed, and security in its interactions with institutional systems.

## Problem Statement
Existing systems are fragmented and lack personalization, creating the need for a unified, intelligent platform that supports student life comprehensively:

- Managing assignment deadlines
- Organizing academic schedules
- Accessing school resources quickly
- Maintaining effective communication
- Tracking academic performance

## Aim and Objectives
**Aim:** Design and develop an intelligent Student Companion System that enhances academic productivity, communication, and resource access among students.

**Objectives:**
1. Design a user-friendly mobile or web interface.
2. Implement a task and timetable management module.
3. Provide access to course materials and academic resources.
4. Integrate a reminder and notification system.
5. Provide communication channels for collaboration.
6. Implement an academic performance tracking feature.
7. Evaluate system usability and efficiency.

## Scope of the Study
The system covers academic scheduling, task management, collaboration, learning resources, and academic performance tracking.

## Significance of the Study
The main purpose of the Development of a student companion system platform is to bridge the communication and service delivery gaps experienced by students in the university. The platform was conceived as a solution to decentralization and inefficiencies by providing a single access point for key academic and campus services.

Key benefits include:
- Improve student organization
- Enhance productivity and motivation
- Provide centralized access to academic information
- Enable better communication among students and lecturers
- Support academic decision-making through performance insights

## Methodology
**Software Development Life Cycle (SDLC): Waterfall Model**

1. **Requirements Gathering**
   - Interview students, staff, and new visitors to understand navigation challenges.
2. **System Analysis**
   - Define functional and non-functional requirements.
   - Identify key features, performance, and usability expectations.
3. **System Design**
   - Use UML diagrams, ER diagrams, and UI wireframes to visualize architecture.
   - Design database schema for storing campus locations and routes.
4. **Implementation**
   - Backend: Python (Flask/Django) or Node.js.
   - Frontend: HTML, CSS, JavaScript, or React for interactive maps.
   - Mapping System: Integration of Map API or custom-built interactive map.
5. **Testing**
   - Unit Testing – validate individual functions.
   - Functional Testing – ensure all features work as expected.
   - Performance Testing – check responsiveness and speed.
   - User Acceptance Testing (UAT) – validate usability with actual students.

## Software Development Life Cycle (SDLC) Phases
1. Requirement Analysis: Identify missing navigation needs and necessary features.
2. System Design: Develop architecture diagrams, database schema, and interface layouts.
3. Implementation: Develop frontend, backend, database, and mapping system.
4. Testing: Detect and fix bugs, validate paths, and ensure accuracy.
5. Deployment: Host the system online for use by students and visitors.
6. Maintenance: Update maps, add new locations, and improve system performance.

## System Implementation Approach
### 1. System Architecture
The application will adopt a client–server architecture:
- **Frontend (Mobile/Web App):** Handles user interactions, weekly activity reports, performance graphs, reminder and notification system, alerts for new materials, reminders for classes.
- **Backend Server (API):** Built with Node.js/Express or Python Flask/Django, responsible for processing requests, authentication, and data handling.
- **Database Layer:** Stores campus locations, paths, and user activity using MongoDB, MySQL, or PostgreSQL, depending on final requirements.

This layered structure ensures the application remains lightweight, scalable, and maintainable.

### 2. Data Flow
1. User opens the app.
2. App sends requests to the backend server through secure APIs.
3. Backend processes requests and interacts with the database.
4. Results are returned and displayed on the user interface.

Data flows in a predictable, structured, and secure manner, ensuring reliability and responsiveness.

### 3. Core Modules to Be Implemented
- **Profile Settings Management:** Users should be able to update their display name, email (non-editable for security), matriculation number, department, and profile picture. These updates must reflect immediately across the platform, including on posts and library uploads associated with the user.
- **User Registration and Authentication:** Users must be able to register for a new account using their institutional email addresses, with verification mechanisms in place. Once registered, users should be able to securely log in and log out of the platform using Firebase Authentication, which ensures identity verification and prevents unauthorized access.

### 4. Development Stages
1. Design UI prototypes and map interface layouts.
2. Set up backend API and database schema.
3. Develop core app screens and interactive features.
4. Integrate frontend with backend APIs.
5. Test individual modules and features (unit testing).
6. Conduct full system testing on devices (functional and user acceptance testing).
7. Deploy application online and prepare for user access.

## Expected Results
- A fully accessible mobile application guiding students and staff efficiently.
- Reminder and notification system for students.
- Alerts for new materials.
- Weekly activity reports.
- Group chart.
- Course discussion group.
- Peer-to-peer resource sharing.
- Performance graphs.
- Enhanced academic engagement and user satisfaction.

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure Appwrite
Create a `.env` file in the project root with the following variables:
```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_TASKS_COLLECTION_ID=your_tasks_collection_id
VITE_APPWRITE_RESOURCES_COLLECTION_ID=your_resources_collection_id
VITE_APPWRITE_REMINDERS_COLLECTION_ID=your_reminders_collection_id
VITE_APPWRITE_MESSAGES_COLLECTION_ID=your_messages_collection_id
VITE_APPWRITE_PERFORMANCE_COLLECTION_ID=your_performance_collection_id
VITE_APPWRITE_BUCKET_ID=your_bucket_id
```

### 3) Run the app
```bash
npm run dev
```
>>>>>>> theirs
