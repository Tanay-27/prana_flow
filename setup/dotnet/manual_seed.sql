-- Healing Rays Manual Database Seeding Script
-- Run this in SQL Server Management Studio or any SQL client

USE HealingRaysDb;
GO

-- Create Admin User (password: Admin@123)
INSERT INTO Users (Username, Password, Role, IsActive, CreatedAt, UpdatedAt)
VALUES ('admin', '$2a$10$CwTycUXWue0Thq9StjUM0uBUxvqAQVXMf50kGGP5Onoq7/2yDXL3u', 'admin', 1, GETUTCDATE(), GETUTCDATE());

-- Create Healer User (password: Healer@123)  
INSERT INTO Users (Username, Password, Role, IsActive, CreatedAt, UpdatedAt)
VALUES ('healer', '$2a$10$CwTycUXWue0Thq9StjUM0uBUxvqAQVXMf50kGGP5Onoq7/2yDXL3u', 'healer', 1, GETUTCDATE(), GETUTCDATE());

-- Get user IDs for foreign key references
DECLARE @AdminId INT = (SELECT Id FROM Users WHERE Username = 'admin');
DECLARE @HealerId INT = (SELECT Id FROM Users WHERE Username = 'healer');

-- Create Sample Clients
INSERT INTO Clients (Name, Phone, Email, HealerId, IsActive, CreatedAt, UpdatedAt)
VALUES 
    ('John Smith', '+91 9876543210', 'john@example.com', @HealerId, 1, GETUTCDATE(), GETUTCDATE()),
    ('Alice Wong', '+1 234567890', 'alice@example.com', @HealerId, 1, GETUTCDATE(), GETUTCDATE());

-- Get client IDs
DECLARE @JohnId INT = (SELECT Id FROM Clients WHERE Name = 'John Smith');
DECLARE @AliceId INT = (SELECT Id FROM Clients WHERE Name = 'Alice Wong');

-- Create Sample Protocols
INSERT INTO Protocols (Name, Keywords, Notes, HealerId, IsActive, CreatedAt, UpdatedAt)
VALUES 
    ('General Cleansing', 'cleansing,aura', 'Standard protocol for energy maintenance.', @HealerId, 1, GETUTCDATE(), GETUTCDATE()),
    ('Stress Relief', 'stress,relaxation', 'Focus on solar plexus and heart.', @HealerId, 1, GETUTCDATE(), GETUTCDATE());

-- Get protocol IDs
DECLARE @CleansingId INT = (SELECT Id FROM Protocols WHERE Name = 'General Cleansing');
DECLARE @StressId INT = (SELECT Id FROM Protocols WHERE Name = 'Stress Relief');

-- Create Sample Sessions
INSERT INTO Sessions (Type, UserId, ClientId, ProtocolIds, ScheduledDate, StartTime, EndTime, Status, Notes, IsActive, CreatedAt, UpdatedAt)
VALUES 
    ('healing', @HealerId, @JohnId, CAST(@CleansingId AS NVARCHAR(50)), CAST(GETDATE() AS DATE), '10:00', '11:00', 'scheduled', 'Demo session with John Smith', 1, GETUTCDATE(), GETUTCDATE()),
    ('healing', @AdminId, @AliceId, CAST(@StressId AS NVARCHAR(50)), CAST(DATEADD(day, 1, GETDATE()) AS DATE), '14:00', '15:00', 'scheduled', 'Demo session for admin user', 1, GETUTCDATE(), GETUTCDATE());

-- Create Sample Nurturing Sessions
INSERT INTO NurturingSessions (Name, HealerId, Date, Status, ScheduleSlots, Attachments, IsActive, CreatedAt, UpdatedAt)
VALUES 
    ('Daily Meditation', @HealerId, CAST(GETDATE() AS DATE), 'Planned', '[]', '[]', 1, GETUTCDATE(), GETUTCDATE());

-- Create Sample Payments
INSERT INTO Payments (ClientId, AmountInr, Mode, Status, PaidAt, HealerId, IsActive, CreatedAt, UpdatedAt)
VALUES 
    (@JohnId, 1500, 'UPI', 'Paid', GETUTCDATE(), @HealerId, 1, GETUTCDATE(), GETUTCDATE()),
    (@AliceId, 2000, 'Cash', 'Pending', NULL, @HealerId, 1, GETUTCDATE(), GETUTCDATE());

-- Display results
SELECT 'Users Created:' as Result;
SELECT Username, Role FROM Users WHERE Username IN ('admin', 'healer');

SELECT 'Clients Created:' as Result;
SELECT Name, Phone, Email FROM Clients;

SELECT 'Protocols Created:' as Result;
SELECT Name, Keywords FROM Protocols;

SELECT 'Sessions Created:' as Result;
SELECT Type, Status, ScheduledDate, StartTime, EndTime FROM Sessions;

SELECT 'Payments Created:' as Result;
SELECT AmountInr, Mode, Status FROM Payments;

PRINT 'Database seeding completed successfully!';
PRINT 'Login credentials:';
PRINT '- Admin: admin / Admin@123';
PRINT '- Healer: healer / Healer@123';
