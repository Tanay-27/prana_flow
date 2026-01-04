using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HealingRays.Api.Configuration;
using HealingRays.Api.Models;
using BCrypt.Net;

namespace HealingRays.Api.Services.Implementations
{
    public class DatabaseSeeder
    {
        private readonly HealingRaysDbContext _context;
        private readonly ILogger<DatabaseSeeder> _logger;

        public DatabaseSeeder(HealingRaysDbContext context, ILogger<DatabaseSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            try
            {
                _logger.LogInformation("Starting database seeding...");

                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // 1. Create Admin User
                var admin = await CreateAdminUserAsync();
                
                // 2. Create Healer User
                var healer = await CreateHealerUserAsync();

                // 3. Create Sample Clients
                var clients = await CreateSampleClientsAsync(healer.Id);

                // 4. Create Sample Protocols
                var protocols = await CreateSampleProtocolsAsync(healer.Id);

                // 5. Create Sample Sessions
                await CreateSampleSessionsAsync(admin.Id, healer.Id, clients, protocols);

                // 6. Create Sample Nurturing Sessions
                await CreateSampleNurturingSessionsAsync(healer.Id);

                // 7. Create Sample Payments
                await CreateSamplePaymentsAsync(healer.Id, clients);

                await _context.SaveChangesAsync();
                _logger.LogInformation("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database seeding failed");
                throw;
            }
        }

        private async Task<User> CreateAdminUserAsync()
        {
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            
            if (existingAdmin == null)
            {
                var admin = new User
                {
                    Username = "admin",
                    Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(admin);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Admin user created: admin / Admin@123");
                return admin;
            }
            else
            {
                // Reset password for existing admin
                existingAdmin.Password = BCrypt.Net.BCrypt.HashPassword("Admin@123");
                existingAdmin.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("Admin password reset to Admin@123");
                return existingAdmin;
            }
        }

        private async Task<User> CreateHealerUserAsync()
        {
            var existingHealer = await _context.Users.FirstOrDefaultAsync(u => u.Username == "healer");
            
            if (existingHealer == null)
            {
                var healer = new User
                {
                    Username = "healer",
                    Password = BCrypt.Net.BCrypt.HashPassword("Healer@123"),
                    Role = "healer",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(healer);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Healer user created: healer / Healer@123");
                return healer;
            }
            else
            {
                // Reset password for existing healer
                existingHealer.Password = BCrypt.Net.BCrypt.HashPassword("Healer@123");
                existingHealer.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("Healer password reset to Healer@123");
                return existingHealer;
            }
        }

        private async Task<List<Client>> CreateSampleClientsAsync(int healerId)
        {
            var existingClients = await _context.Clients.Where(c => c.HealerId == healerId).ToListAsync();
            
            if (existingClients.Any())
            {
                _logger.LogInformation($"Found {existingClients.Count} existing clients, skipping client creation");
                return existingClients;
            }

            var clients = new List<Client>
            {
                new Client
                {
                    Name = "John Smith",
                    Phone = "+91 9876543210",
                    Email = "john@example.com",
                    HealerId = healerId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Notes = new List<HealingNote>()
                },
                new Client
                {
                    Name = "Alice Wong",
                    Phone = "+1 234567890",
                    Email = "alice@example.com",
                    HealerId = healerId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Notes = new List<HealingNote>()
                }
            };

            _context.Clients.AddRange(clients);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Created {clients.Count} sample clients");
            return clients;
        }

        private async Task<List<Protocol>> CreateSampleProtocolsAsync(int healerId)
        {
            var existingProtocols = await _context.Protocols.Where(p => p.HealerId == healerId).ToListAsync();
            
            if (existingProtocols.Any())
            {
                _logger.LogInformation($"Found {existingProtocols.Count} existing protocols, skipping protocol creation");
                return existingProtocols;
            }

            var protocols = new List<Protocol>
            {
                new Protocol
                {
                    Name = "General Cleansing",
                    Keywords = "cleansing,aura",
                    Notes = "Standard protocol for energy maintenance.",
                    HealerId = healerId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Protocol
                {
                    Name = "Stress Relief",
                    Keywords = "stress,relaxation",
                    Notes = "Focus on solar plexus and heart.",
                    HealerId = healerId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            _context.Protocols.AddRange(protocols);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Created {protocols.Count} sample protocols");
            return protocols;
        }

        private async Task CreateSampleSessionsAsync(int adminId, int healerId, List<Client> clients, List<Protocol> protocols)
        {
            var existingHealerSessions = await _context.Sessions.Where(s => s.UserId == healerId).CountAsync();
            var existingAdminSessions = await _context.Sessions.Where(s => s.UserId == adminId).CountAsync();

            if (existingHealerSessions == 0 && clients.Any() && protocols.Any())
            {
                var healerSession = new Session
                {
                    Type = "healing",
                    UserId = healerId,
                    ClientId = clients[0].Id,
                    ProtocolIds = protocols[0].Id.ToString(),
                    ScheduledDate = DateTime.Today,
                    StartTime = "10:00",
                    EndTime = "11:00",
                    Status = "scheduled",
                    Notes = "Demo session with John Smith",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Sessions.Add(healerSession);
                _logger.LogInformation("Created default healer session");
            }

            if (existingAdminSessions == 0 && clients.Any() && protocols.Any())
            {
                var adminSession = new Session
                {
                    Type = "healing",
                    UserId = adminId,
                    ClientId = clients.Count > 1 ? clients[1].Id : clients[0].Id,
                    ProtocolIds = protocols.Count > 1 ? protocols[1].Id.ToString() : protocols[0].Id.ToString(),
                    ScheduledDate = DateTime.Today.AddDays(1),
                    StartTime = "14:00",
                    EndTime = "15:00",
                    Status = "scheduled",
                    Notes = "Demo session for admin user",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Sessions.Add(adminSession);
                _logger.LogInformation("Created default admin session");
            }
        }

        private async Task CreateSampleNurturingSessionsAsync(int healerId)
        {
            var existingNurturingSessions = await _context.NurturingSessions.Where(ns => ns.HealerId == healerId).CountAsync();
            
            if (existingNurturingSessions == 0)
            {
                var nurturingSession = new NurturingSession
                {
                    Name = "Daily Meditation",
                    HealerId = healerId,
                    Date = DateTime.Today,
                    Status = "Planned",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ScheduleSlots = "[]",
                    Attachments = "[]"
                };

                _context.NurturingSessions.Add(nurturingSession);
                _logger.LogInformation("Created sample nurturing session");
            }
        }

        private async Task CreateSamplePaymentsAsync(int healerId, List<Client> clients)
        {
            var existingPayments = await _context.Payments.Where(p => p.HealerId == healerId).CountAsync();
            
            if (existingPayments == 0 && clients.Any())
            {
                var payments = new List<Payment>
                {
                    new Payment
                    {
                        ClientId = clients[0].Id,
                        AmountInr = 1500,
                        Mode = "UPI",
                        Status = "Paid",
                        PaidAt = DateTime.UtcNow,
                        HealerId = healerId,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                if (clients.Count > 1)
                {
                    payments.Add(new Payment
                    {
                        ClientId = clients[1].Id,
                        AmountInr = 2000,
                        Mode = "Cash",
                        Status = "Pending",
                        HealerId = healerId,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                _context.Payments.AddRange(payments);
                _logger.LogInformation($"Created {payments.Count} sample payments");
            }
        }
    }
}
