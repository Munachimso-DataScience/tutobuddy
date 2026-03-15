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
