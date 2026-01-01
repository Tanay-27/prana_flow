# PranaFlow 🌿

PranaFlow is a premium, specialized practice management system designed specifically for **Pranic Healers**. It streamlines the administrative aspects of healing work, allowing practitioners to focus on what matters most: energy work and patient care.

## ✨ Key Features

- **Practice Dashboard**: Bird's-eye view of your daily healing agenda and nurturing sessions.
- **Advanced Client Management**: Maintain detailed profiles with append-only chronological healing notes.
- **Intelligent Scheduling**: Support for recurring healing schedules and automated agenda generation.
- **Protocol Library**: Organise and store your specific healing protocols with attachments.
- **Revenue Tracking**: Monitor payments, pending dues, and total revenue with specialized filters.
- **Data Sovereignty**: Built-in export/backup functionality to keep your data safe and portable.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS v4 (Custom Premium Theme)
- **State Management**: Zustand (Lightweight & Reactive)
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT with Passport Strategy
- **Object Storage**: Minio (S3 Compatible)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)

### Installation

1. **Step 1: Start Infrastructure (Databases & Storage)**:
   ```bash
   docker-compose up -d
   ```
   *This starts MongoDB (Port 27017) and Minio (Port 9000).*

2. **Step 2: Install Dependencies**:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Step 3: Add Environment Variables**:
   Create a `.env` file in the `backend` directory based on common defaults or your specific setup.

### 🏃 Running the Application

1. **Start the Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Seed the Database (Optional)**:
   To populate the app with sample data for demonstration:
   ```bash
   cd backend
   npm run seed
   ```

## 📁 Project Structure

```text
├── backend/            # NestJS API
│   ├── src/
│   │   ├── auth/       # Authentication & JWT Logic
│   │   ├── clients/    # Client Profiles & Notes
│   │   ├── sessions/   # Healing Schedules
│   │   ├── payments/   # Revenue Tracking
│   │   └── storage/    # Minio/S3 File Handling
├── frontend/           # Vite + React SPA
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── store/      # Zustand State Stores
│   │   └── pages/      # View Components (Dashboard, Clients, etc.)
├── docs/               # Technical Documentation
└── docker-compose.yml  # Local Infrastructure setup
```

## 🔒 Data & Privacy (Rich Media)

PranaFlow stores rich data like profile photos and protocol attachments in **Minio** (an S3-compatible object storage server). 

**Why Minio instead of MongoDB?**
- **Efficiency**: Object storage is optimized for large binary files, whereas MongoDB is optimized for structured documents.
- **Separation of Concerns**: Keeping large files out of the database keeps database backups small and fast.
- **Portability**: Standardizing on S3-compatible API makes it trivial to move to AWS S3 or Google Cloud Storage in the future.

---
*Created with 🙏 for the Healing Community.*
