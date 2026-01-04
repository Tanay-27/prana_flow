# Healing Rays .NET Core API

This is the .NET Core 3.1 backend API for the Healing Rays application, converted from the original NestJS/Node.js implementation.

## Prerequisites

- .NET Core 3.1 SDK
- SQL Server (LocalDB, Express, or full SQL Server)
- Visual Studio 2019+ or VS Code with C# extension

## Getting Started

### 1. Database Setup

1. Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HealingRaysDb;Trusted_Connection=True;"
  }
}
```

2. Run the Entity Framework migrations:
```bash
cd HealingRays.Api
dotnet ef database update
```

### 2. Configuration

Update the JWT secret in `appsettings.json`:
```json
{
  "JwtSettings": {
    "Secret": "your-very-secure-secret-key-here-change-in-production"
  }
}
```

### 3. Run the Application

```bash
cd HealingRays.Api
dotnet run
```

The API will be available at:
- HTTP: https://localhost:5001
- Swagger UI: https://localhost:5001/swagger

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Clients
- `GET /api/clients` - Get all clients (with filtering)
- `GET /api/clients/{id}` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client
- `POST /api/clients/{id}/notes` - Add note to client

### Sessions
- `GET /api/sessions` - Get all sessions (with filtering)
- `GET /api/sessions/{id}` - Get session by ID
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session

### Protocols
- `GET /api/protocols` - Get all protocols
- `GET /api/protocols/{id}` - Get protocol by ID
- `POST /api/protocols` - Create new protocol
- `PUT /api/protocols/{id}` - Update protocol
- `DELETE /api/protocols/{id}` - Delete protocol

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment

### Nurturing Sessions
- `GET /api/nurturingsessions` - Get all nurturing sessions
- `GET /api/nurturingsessions/{id}` - Get nurturing session by ID
- `POST /api/nurturingsessions` - Create new nurturing session
- `PUT /api/nurturingsessions/{id}` - Update nurturing session
- `DELETE /api/nurturingsessions/{id}` - Delete nurturing session

### Health Check
- `GET /api/health` - API health check
- `GET /api/health/ping` - Simple ping endpoint

## Frontend Integration

The API is designed to be fully compatible with the existing React frontend. Key compatibility features:

### Response Structure
All API responses maintain the exact field names and structure expected by the frontend:
- Uses `snake_case` field names (e.g., `base_fee`, `is_active`, `createdAt`)
- Returns arrays for complex fields like `protocol_ids`, `schedule_slots`, `attachments`
- Includes nested objects for related entities (client info in sessions, etc.)

### Authentication
- JWT-based authentication with Bearer token
- Token includes user ID, username, and role
- Automatic authorization checks on protected endpoints

### Filtering
All existing frontend filters work without changes:
- Client filters: name, is_active, date ranges
- Session filters: type, status, client_id, date ranges
- Support for all query parameters used by the frontend

## File Upload

The API supports file uploads through the `IFileService`:
- Configurable file size limits (default: 10MB)
- Allowed file types: .jpg, .jpeg, .png, .pdf
- Files stored locally in `Uploads/` directory
- File paths returned for storage in database

## Database Schema

The API uses Entity Framework Core with SQL Server and maintains exact compatibility with the original MongoDB schema:

### Key Entities
- **Users**: Authentication and healer management
- **Clients**: Client information with notes and protocol associations
- **Sessions**: Healing/nurturing sessions with scheduling
- **Protocols**: Treatment protocols with keywords and attachments
- **Payments**: Payment tracking with multiple modes
- **NurturingSessions**: Group healing sessions

### Relationships
- Users own Clients, Sessions, Protocols, Payments, and NurturingSessions
- Sessions reference Clients and Users
- Payments reference Sessions and Clients
- Clients can be associated with multiple Protocols

## Security

- JWT token authentication
- Role-based authorization
- Input validation with FluentValidation
- CORS configured for frontend integration
- SQL injection protection through EF Core

## Development

### Project Structure
```
HealingRays.Api/
├── Configuration/
│   ├── HealingRaysDbContext.cs
│   └── MappingProfile.cs
├── Controllers/
│   ├── AuthController.cs
│   ├── ClientsController.cs
│   ├── SessionsController.cs
│   ├── ProtocolsController.cs
│   ├── PaymentsController.cs
│   ├── NurturingSessionsController.cs
│   └── HealthController.cs
├── Models/
│   ├── User.cs
│   ├── Client.cs
│   ├── Session.cs
│   ├── Protocol.cs
│   ├── Payment.cs
│   ├── NurturingSession.cs
│   └── HealingNote.cs
├── Repositories/
│   ├── Interfaces/
│   │   └── IRepository.cs
│   └── Implementations/
│       ├── Repository.cs
│       ├── UserRepository.cs
│       ├── ClientRepository.cs
│       └── ...
├── Services/
│   ├── Interfaces/
│   │   └── IService.cs
│   └── Implementations/
│       ├── AuthService.cs
│       ├── ClientService.cs
│       ├── SessionService.cs
│       ├── FileService.cs
│       └── ...
├── DTOs/
│   └── Auth/
│       └── AuthDto.cs
└── Program.cs
```

## Migration from NestJS

This API is a complete conversion from the original NestJS/Node.js backend:

### Key Changes
- **Framework**: .NET Core 3.1 Web API
- **Database**: SQL Server with Entity Framework Core
- **ORM**: EF Core instead of Mongoose
- **Language**: C# instead of TypeScript
- **Dependency Injection**: Built-in DI container
- **Authentication**: JWT with Microsoft.AspNetCore.Authentication.JwtBearer

### Compatibility Maintained
- **API Endpoints**: Exact same routes and HTTP methods
- **Request/Response Format**: Identical JSON structures
- **Authentication Flow**: Same JWT token format
- **Filtering**: All existing frontend filters work unchanged
- **File Upload**: Same upload patterns and validation

The conversion ensures zero breaking changes for the frontend while providing the benefits of the .NET ecosystem.
