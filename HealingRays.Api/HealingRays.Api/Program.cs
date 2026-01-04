using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using HealingRays.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson();

// Database Context
builder.Services.AddDbContext<HealingRaysDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"])),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Fluent Validation
builder.Services.AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();

// Swagger/OpenAPI
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Healing Rays API", Version = "v1" });

    // Add JWT Bearer token support
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Register services
// TODO: Register all services (repositories, services) here

// Register repositories
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.IUserRepository, HealingRays.Api.Repositories.Implementations.UserRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.IClientRepository, HealingRays.Api.Repositories.Implementations.ClientRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.ISessionRepository, HealingRays.Api.Repositories.Implementations.SessionRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.IProtocolRepository, HealingRays.Api.Repositories.Implementations.ProtocolRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.IPaymentRepository, HealingRays.Api.Repositories.Implementations.PaymentRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.INurturingSessionRepository, HealingRays.Api.Repositories.Implementations.NurturingSessionRepository>();
builder.Services.AddScoped<HealingRays.Api.Repositories.Interfaces.IHealingNoteRepository, HealingRays.Api.Repositories.Implementations.HealingNoteRepository>();

// Register services
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.IAuthService, HealingRays.Api.Services.Implementations.AuthService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.IUserService, HealingRays.Api.Services.Implementations.UserService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.IClientService, HealingRays.Api.Services.Implementations.ClientService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.ISessionService, HealingRays.Api.Services.Implementations.SessionService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.IProtocolService, HealingRays.Api.Services.Implementations.ProtocolService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.IPaymentService, HealingRays.Api.Services.Implementations.PaymentService>();
builder.Services.AddScoped<HealingRays.Api.Services.Interfaces.INurturingSessionService, HealingRays.Api.Services.Implementations.NurturingSessionService>();

// Register file service
builder.Services.AddScoped<HealingRays.Api.Services.Implementations.IFileService, HealingRays.Api.Services.Implementations.LocalFileService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Healing Rays API v1"));
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
