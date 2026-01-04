# Healing Rays 🌿

Healing Rays is a premium, specialized practice management system designed specifically for **Pranic Healers**. It streamlines the administrative aspects of healing work, allowing practitioners to focus on what matters most: energy work and patient care.

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
- **Framework**: .NET Core 3.1 Web API
- **Database**: Microsoft SQL Server (LocalDB/SQL Server)
- **Authentication**: JWT with ASP.NET Core Authentication
- **File Storage**: Local File System Service
- **Architecture**: Integrated SPA (Single Page Application)

## 🏗️ Architecture

The application uses an **integrated architecture** where .NET Core serves both the API and React frontend:

```
┌─────────────────────────────────────┐
│        .NET Core Application       │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   React     │ │   Web API       ││
│  │  Frontend   │ │  Controllers    ││
│  │ (wwwroot/)  │ │   (/api/*)      ││
│  └─────────────┘ └─────────────────┘│
│         Single Process              │
│      Single Port (5000)             │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Single deployment artifact
- ✅ No separate web server required
- ✅ No CORS configuration needed
- ✅ Simplified maintenance

## 🚀 Getting Started

### Prerequisites

#### Development Machine (Your Local Setup)
- [Node.js](https://nodejs.org/) (v16 or higher) - for building frontend
- **Git** - for version control
- **Text Editor/IDE** - for code editing

#### Production Server (Windows Server)
- **Windows Server 2016+**
- **.NET Core 3.1 Runtime** (ASP.NET Core) - installed by deployment scripts
- **SQL Server** (LocalDB or full instance)
- **NSSM** (Non-Sucking Service Manager) - installed by deployment scripts

**Note**: You don't need .NET Core on your development machine! The deployment scripts will install it on the production server.

### Development Setup (No .NET Core Required)

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd healing-rays
   ```

2. **Build Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   # Copy build to .NET Core wwwroot
   mkdir -p ../HealingRays.Api/HealingRays.Api/wwwroot
   cp -r dist/* ../HealingRays.Api/HealingRays.Api/wwwroot/
   ```

3. **Commit Built Files**:
   ```bash
   git add .
   git commit -m "Add built frontend and .NET Core backend"
   git push
   ```

4. **Database Seeding (Manual)**:
   - Use the SQL script: `setup/dotnet/manual_seed.sql`
   - Run in SQL Server Management Studio or any SQL client
   - Creates default users: admin/Admin@123, healer/Healer@123

### Production Deployment

For Windows Server deployment, use the automated PowerShell scripts:

1. **Install Prerequisites**:
   ```powershell
   .\setup\dotnet\scripts\Install-Prerequisites.ps1
   ```

2. **Setup Database**:
   ```powershell
   .\setup\dotnet\scripts\Setup-Database.ps1
   ```

3. **Deploy Application**:
   ```powershell
   .\setup\dotnet\scripts\Deploy-Integrated.ps1
   ```

4. **Health Check**:
   ```powershell
   .\setup\dotnet\scripts\Health-Check.ps1
   ```

## 📁 Project Structure

```text
├── HealingRays.Api/           # .NET Core Web API
│   ├── HealingRays.Api/
│   │   ├── Controllers/       # API Controllers
│   │   ├── Services/          # Business Logic
│   │   ├── Repositories/      # Data Access Layer
│   │   ├── Models/           # Entity Models
│   │   ├── DTOs/             # Data Transfer Objects
│   │   ├── Configuration/    # Database Context
│   │   └── wwwroot/          # React Frontend Build
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI Components
│   │   ├── store/           # Zustand State Stores
│   │   ├── pages/           # View Components
│   │   └── api/             # API Client
├── setup/                   # Deployment Scripts
│   └── dotnet/
│       ├── scripts/         # PowerShell Deployment Scripts
│       └── dotnet_deployment.md  # Deployment Guide
└── docs/                    # Technical Documentation
```

## 🔧 Configuration

### Database Configuration

Update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HealingRaysDb;Trusted_Connection=true;"
  },
  "JwtSettings": {
    "Secret": "your-super-secret-jwt-key-here",
    "ExpiryInDays": 7
  }
}
```

### Frontend Configuration

The frontend automatically uses relative API paths since it's served from the same origin.

## 🚀 Deployment Options

### Option 1: Integrated Deployment (Recommended)
- Single .NET Core application serving both frontend and API
- No additional web server required
- Simplified configuration and maintenance

### Option 2: Separate Deployment
- Frontend served by Nginx/IIS
- Backend as separate API service
- Traditional microservices approach

## 📋 Service Management

The application runs as a Windows Service:

```powershell
# Service management commands
Start-Service -Name HealingRaysApp
Stop-Service -Name HealingRaysApp
Restart-Service -Name HealingRaysApp
Get-Service -Name HealingRaysApp
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **SQL Server Security**: Integrated Windows authentication
- **Input Validation**: Comprehensive data validation
- **File Upload Security**: Restricted file types and sizes
- **HTTPS Support**: SSL/TLS encryption ready

## 📊 Monitoring & Health Checks

Use the built-in health check script:

```powershell
.\setup\dotnet\scripts\Health-Check.ps1
```

This verifies:
- ✅ Windows Service status
- ✅ Application responsiveness
- ✅ Frontend accessibility
- ✅ API endpoints
- ✅ Database connectivity

## 🔄 Migration from Node.js

This application was migrated from a Node.js/NestJS backend to .NET Core 3.1. The migration maintains:

- ✅ **Exact API compatibility**: All endpoints and response formats preserved
- ✅ **Database schema mapping**: MongoDB structure mapped to SQL Server
- ✅ **Frontend compatibility**: React frontend works without changes
- ✅ **Feature parity**: All functionality maintained

## 📚 Documentation

- **Deployment Guide**: `setup/dotnet/dotnet_deployment.md`
- **API Documentation**: Available at `/swagger` when running
- **Database Schema**: `setup/dotnet/mssql_schema.sql`

## 🛠️ Development Commands

```bash
# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production

# Backend development
cd HealingRays.Api/HealingRays.Api
dotnet run           # Start development server
dotnet build         # Build application
dotnet publish       # Publish for deployment

# Database operations
dotnet ef migrations add <name>    # Create migration
dotnet ef database update         # Apply migrations

# Seed database with sample data
dotnet run seed                   # Seed database
```

## 🎯 Production Checklist

- [ ] Install .NET Core 3.1 Runtime
- [ ] Configure SQL Server
- [ ] Build and deploy frontend to wwwroot
- [ ] Configure appsettings.json
- [ ] Install as Windows Service
- [ ] Configure firewall (port 5000)
- [ ] Run health checks
- [ ] Setup backup procedures

---

*Created with 🙏 for the Healing Community.*
