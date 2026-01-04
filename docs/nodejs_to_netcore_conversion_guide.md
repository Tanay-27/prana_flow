# Node.js to .NET Core 3.1 Conversion Guide

## Overview
This guide provides step-by-step instructions to convert the Healing Rays Node.js/NestJS application to .NET Core 3.1 with MSSQL Server.

## Current Architecture Analysis

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport
- **File Storage**: MinIO
- **Key Modules**: Auth, Users, Clients, Sessions, Payments, Protocols, NurturingSessions

### Frontend (React)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios

### Database Schema
6 main collections: Users, Clients, Sessions, Protocols, Payments, NurturingSessions

## Conversion Strategy

**Note**: This is a new application build - no data migration required. Focus is on maintaining exact schema mapping and frontend filter compatibility.

### Phase 1: .NET Core Backend Setup

#### 1.1 Create New .NET Core 3.1 Project
```bash
# Create solution
dotnet new sln -n HealingRays

# Create Web API project
dotnet new webapi -n HealingRays.Api -f netcoreapp3.1
cd HealingRays.Api

# Add to solution
dotnet sln ../HealingRays.sln add HealingRays.Api.csproj
```

#### 1.2 Install Required NuGet Packages
```xml
<!-- Add to HealingRays.Api.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="3.1.32" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="3.1.32" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="3.1.32" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="3.1.32" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="6.10.0" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="8.1.1" />
<PackageReference Include="FluentValidation.AspNetCore" Version="9.5.4" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="5.6.3" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.NewtonsoftJson" Version="3.1.32" />
```

### Phase 2: Database Schema Design

#### 2.1 Create Entity Models (Exact Schema Mapping)
Ensure exact field mapping from MongoDB schemas to maintain frontend filter compatibility:
Create `Models/` folder with entity classes:

**User.cs**
```csharp
public class User
{
    public int Id { get; set; }
    [Required]
    public string Username { get; set; }
    public string Password { get; set; } // Will be hashed
    public string Role { get; set; } = "user";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<Client> Clients { get; set; }
    public ICollection<Session> Sessions { get; set; }
    public ICollection<Protocol> Protocols { get; set; }
    public ICollection<Payment> Payments { get; set; }
    public ICollection<NurturingSession> NurturingSessions { get; set; }
}
```

**Client.cs**
```csharp
public class Client
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; }
    public string Photo { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public decimal BaseFee { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public int HealerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User Healer { get; set; }
    public ICollection<HealingNote> Notes { get; set; }
    public ICollection<ClientProtocol> ClientProtocols { get; set; }
    public ICollection<Session> Sessions { get; set; }
    public ICollection<Payment> Payments { get; set; }
}
```

**Complete Entity Models for Schema Compatibility:**

```csharp
// Session.cs - Exact mapping from session.schema.ts
public class Session
{
    public int Id { get; set; }
    [Required]
    public string Type { get; set; } // "healing" or "nurturing"
    public int UserId { get; set; }
    public int? ClientId { get; set; }
    public string ProtocolIds { get; set; } // JSON array as string
    [Required]
    public DateTime ScheduledDate { get; set; }
    public string StartTime { get; set; }
    public string EndTime { get; set; }
    public string ScheduleSlots { get; set; } // JSON array as string
    public string Status { get; set; } = "scheduled";
    public string Notes { get; set; }
    public decimal Fee { get; set; } = 0;
    public string Attachments { get; set; } // JSON array as string
    public bool SelfSession { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; }
    public Client Client { get; set; }
}

// Protocol.cs - Exact mapping from protocol.schema.ts
public class Protocol
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; }
    public string Notes { get; set; }
    public string Keywords { get; set; } // JSON array as string
    public string Attachments { get; set; } // JSON array as string
    public int HealerId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User Healer { get; set; }
}

// Payment.cs - Exact mapping from payment.schema.ts
public class Payment
{
    public int Id { get; set; }
    public int? SessionId { get; set; }
    [Required]
    public int ClientId { get; set; }
    [Required]
    public decimal AmountInr { get; set; }
    [Required]
    public string Mode { get; set; } // "Cash", "UPI", "Bank"
    public string Status { get; set; } = "Pending"; // "Paid", "Pending"
    public DateTime? PaidAt { get; set; }
    public int HealerId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public Session Session { get; set; }
    public Client Client { get; set; }
    public User Healer { get; set; }
}

// NurturingSession.cs - Exact mapping from nurturing-session.schema.ts
public class NurturingSession
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; }
    [Required]
    public DateTime Date { get; set; }
    public string ScheduleSlots { get; set; } // JSON array as string
    public string Coordinator { get; set; }
    public string PaymentDetails { get; set; }
    public string Status { get; set; } = "Planned"; // "Planned", "Registered", "Attended"
    public DateTime? RecordingAvailableTill { get; set; }
    public string Attachments { get; set; } // JSON array as string
    public int HealerId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User Healer { get; set; }
}

// HealingNote.cs - Embedded in Client
public class HealingNote
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;
    [Required]
    public string Text { get; set; }
    
    // Navigation properties
    public Client Client { get; set; }
}
```

#### 2.2 Create DbContext
```csharp
public class HealingRaysDbContext : DbContext
{
    public HealingRaysDbContext(DbContextOptions<HealingRaysDbContext> options) : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Protocol> Protocols { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<NurturingSession> NurturingSessions { get; set; }
    public DbSet<HealingNote> HealingNotes { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure relationships and constraints
        modelBuilder.Entity<Client>()
            .HasOne(c => c.Healer)
            .WithMany(u => u.Clients)
            .HasForeignKey(c => c.HealerId);
            
        // Add other configurations...
    }
}
```

#### 2.3 Database Migration Commands
```bash
# Add migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update
```

### Phase 3: Service Layer Implementation

#### 3.1 Create Repository Pattern
```csharp
public interface IRepository<T> where T : class
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
}
```

#### 3.2 Implement Services
Create service classes for each domain:
- `UserService`
- `ClientService`
- `SessionService`
- `PaymentService`
- `ProtocolService`
- `NurturingSessionService`

### Phase 4: API Controllers

#### 4.1 Create Controllers
Map each NestJS controller to ASP.NET Core controller:

**AuthController.cs**
```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);
        return Ok(result);
    }
}
```

### Phase 5: Authentication & Authorization

#### 5.1 JWT Configuration
```csharp
// In Startup.cs
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

### Phase 6: File Upload Handling

#### 6.1 Replace MinIO with Local/Azure Storage
```csharp
public interface IFileService
{
    Task<string> UploadFileAsync(IFormFile file);
    Task<byte[]> GetFileAsync(string filePath);
    Task DeleteFileAsync(string filePath);
}
```

### Phase 7: Configuration & Environment

#### 7.1 appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HealingRaysDb;Trusted_Connection=true;"
  },
  "JwtSettings": {
    "Secret": "your-secret-key",
    "ExpirationDays": 30
  },
  "FileUpload": {
    "MaxSizeBytes": 10485760,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".pdf"]
  }
}
```

### Phase 8: Frontend Integration & Filter Compatibility

#### 8.1 Update API Base URL
```typescript
// frontend/src/api/client.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:5001/api',
});
```

#### 8.2 Maintain Exact API Response Structure
Ensure API responses match existing frontend expectations:

```csharp
// Example: ClientsController maintaining exact response format
[HttpGet]
public async Task<IActionResult> GetClients([FromQuery] ClientFilterDto filter)
{
    var clients = await _clientService.GetClientsAsync(filter);
    
    // Maintain exact response structure for frontend filters
    var response = clients.Select(c => new
    {
        id = c.Id,
        name = c.Name,
        photo = c.Photo,
        phone = c.Phone,
        email = c.Email,
        base_fee = c.BaseFee,  // Keep snake_case for compatibility
        is_active = c.IsActive,
        healer_id = c.HealerId,
        notes = c.Notes.Select(n => new
        {
            timestamp = n.Timestamp,
            text = n.Text
        }),
        protocol_ids = JsonSerializer.Deserialize<int[]>(c.ProtocolIds ?? "[]"),
        createdAt = c.CreatedAt,
        updatedAt = c.UpdatedAt
    });
    
    return Ok(response);
}
```

#### 8.3 Preserve Filter Parameters
Ensure all existing frontend filters work without changes:

```csharp
public class ClientFilterDto
{
    public string Name { get; set; }
    public bool? IsActive { get; set; }
    public int? HealerId { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
}

public class SessionFilterDto
{
    public string Type { get; set; }  // "healing" or "nurturing"
    public string Status { get; set; }
    public int? ClientId { get; set; }
    public int? UserId { get; set; }
    public DateTime? ScheduledAfter { get; set; }
    public DateTime? ScheduledBefore { get; set; }
    public bool? SelfSession { get; set; }
}
```

### Phase 9: Testing & Validation

#### 9.1 Unit Tests
Create unit tests for services and controllers using xUnit.

#### 9.2 Integration Tests
Test API endpoints and database operations.

### Phase 10: Deployment

#### 10.1 Production Configuration
- Configure connection strings
- Set up HTTPS certificates
- Configure CORS policies
- Set up logging

#### 10.2 Database Deployment
- Generate production migration scripts
- Set up SQL Server database
- Configure backup strategies

## Migration Checklist

### Backend Migration
- [ ] Create .NET Core 3.1 project structure
- [ ] Install required NuGet packages
- [ ] Create entity models
- [ ] Set up Entity Framework DbContext
- [ ] Implement repository pattern
- [ ] Create service layer
- [ ] Implement API controllers
- [ ] Set up JWT authentication
- [ ] Implement file upload service
- [ ] Configure dependency injection
- [ ] Set up validation
- [ ] Create DTOs and AutoMapper profiles
- [ ] Implement error handling middleware
- [ ] Set up logging
- [ ] Create unit tests
- [ ] Create integration tests

### Database Setup (New Application)
- [ ] Design MSSQL schema with exact field mapping
- [ ] Create Entity Framework migrations
- [ ] Set up database indexes for performance
- [ ] Configure foreign key relationships
- [ ] Set up stored procedures (if needed)
- [ ] Configure backup strategy

### Frontend Compatibility
- [ ] Update API base URLs
- [ ] Ensure exact API response structure matches existing frontend
- [ ] Maintain all existing filter parameters
- [ ] Test authentication flow compatibility
- [ ] Test all API integrations with existing frontend
- [ ] Update error handling to match existing patterns
- [ ] Test file upload functionality
- [ ] Validate all CRUD operations work with existing UI
- [ ] Verify all existing filters and search functionality

### Testing & Deployment
- [ ] Set up development environment
- [ ] Configure staging environment
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Set up monitoring and logging
- [ ] Create deployment documentation
- [ ] Perform load testing
- [ ] Create rollback procedures

## Estimated Timeline

- **Phase 1-2**: Project setup and database migration (1-2 weeks)
- **Phase 3-4**: Service layer and controllers (2-3 weeks)
- **Phase 5-6**: Authentication and file handling (1 week)
- **Phase 7-8**: Configuration and frontend integration (1 week)
- **Phase 9-10**: Testing and deployment (1-2 weeks)

**Total Estimated Time**: 6-9 weeks

## Key Considerations

### Schema Mapping & Frontend Compatibility
- Ensure exact field mapping from MongoDB schemas to MSSQL entities
- Maintain snake_case field names in API responses for frontend compatibility
- Preserve all existing filter parameters and query structures
- Handle JSON array fields (protocol_ids, schedule_slots, attachments) appropriately

### Performance Optimization
- Implement proper indexing strategy
- Use async/await patterns
- Implement caching where appropriate
- Optimize database queries

### Security
- Implement proper input validation
- Set up CORS policies
- Use HTTPS in production
- Implement rate limiting
- Set up proper error handling

### Monitoring
- Set up application logging
- Implement health checks
- Set up performance monitoring
- Configure alerting

## Conclusion

The conversion from Node.js/NestJS to .NET Core 3.1 is **feasible and recommended**. The current application architecture translates well to .NET patterns, and the functionality can be preserved while gaining benefits of the .NET ecosystem including better performance, strong typing, and enterprise-grade tooling.

The main challenges will be:
1. Maintaining exact API response structure for frontend compatibility
2. Adapting to Entity Framework patterns while preserving schema mapping
3. File upload service replacement (MinIO to local/cloud storage)
4. Ensuring all existing filters and search functionality work seamlessly

With proper planning and execution, this conversion will result in a more maintainable and scalable application.
