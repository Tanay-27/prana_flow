-- Healing Rays .NET Core 3.1 - MSSQL Database Schema
-- Generated CREATE TABLE scripts for Entity Framework Core models

-- Users table
CREATE TABLE [Users] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Username] NVARCHAR(450) NOT NULL UNIQUE,
    [Password] NVARCHAR(MAX) NOT NULL,
    [Role] NVARCHAR(MAX) NOT NULL DEFAULT 'user',
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Clients table
CREATE TABLE [Clients] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(MAX) NOT NULL,
    [Photo] NVARCHAR(MAX),
    [Phone] NVARCHAR(MAX),
    [Email] NVARCHAR(MAX),
    [BaseFee] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [HealerId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Clients_Users_HealerId] FOREIGN KEY ([HealerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

-- Protocols table
CREATE TABLE [Protocols] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(MAX) NOT NULL,
    [Notes] NVARCHAR(MAX),
    [Keywords] NVARCHAR(MAX), -- JSON array as string
    [Attachments] NVARCHAR(MAX), -- JSON array as string
    [HealerId] INT NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Protocols_Users_HealerId] FOREIGN KEY ([HealerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

-- ClientProtocols junction table (many-to-many relationship)
CREATE TABLE [ClientProtocols] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [ClientId] INT NOT NULL,
    [ProtocolId] INT NOT NULL,
    CONSTRAINT [FK_ClientProtocols_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ClientProtocols_Protocols_ProtocolId] FOREIGN KEY ([ProtocolId]) REFERENCES [Protocols] ([Id]) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE [Sessions] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Type] NVARCHAR(MAX) NOT NULL, -- 'healing' or 'nurturing'
    [UserId] INT NOT NULL,
    [ClientId] INT,
    [ProtocolIds] NVARCHAR(MAX), -- JSON array as string
    [ScheduledDate] DATETIME2 NOT NULL,
    [StartTime] NVARCHAR(MAX),
    [EndTime] NVARCHAR(MAX),
    [ScheduleSlots] NVARCHAR(MAX), -- JSON array as string
    [Status] NVARCHAR(MAX) NOT NULL DEFAULT 'scheduled',
    [Notes] NVARCHAR(MAX),
    [Fee] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Attachments] NVARCHAR(MAX), -- JSON array as string
    [SelfSession] BIT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Sessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Sessions_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE [Payments] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [SessionId] INT,
    [ClientId] INT NOT NULL,
    [AmountInr] DECIMAL(18,2) NOT NULL,
    [Mode] NVARCHAR(MAX) NOT NULL, -- 'Cash', 'UPI', 'Bank'
    [Status] NVARCHAR(MAX) NOT NULL DEFAULT 'Pending', -- 'Paid', 'Pending'
    [PaidAt] DATETIME2,
    [HealerId] INT NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Payments_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Payments_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Payments_Users_HealerId] FOREIGN KEY ([HealerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

-- NurturingSessions table
CREATE TABLE [NurturingSessions] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(MAX) NOT NULL,
    [Date] DATETIME2 NOT NULL,
    [ScheduleSlots] NVARCHAR(MAX), -- JSON array as string
    [Coordinator] NVARCHAR(MAX),
    [PaymentDetails] NVARCHAR(MAX),
    [Status] NVARCHAR(MAX) NOT NULL DEFAULT 'Planned', -- 'Planned', 'Registered', 'Attended'
    [RecordingAvailableTill] DATETIME2,
    [Attachments] NVARCHAR(MAX), -- JSON array as string
    [HealerId] INT NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_NurturingSessions_Users_HealerId] FOREIGN KEY ([HealerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

-- HealingNotes table (for client notes)
CREATE TABLE [HealingNotes] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [ClientId] INT NOT NULL,
    [Timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [Text] NVARCHAR(MAX) NOT NULL,
    CONSTRAINT [FK_HealingNotes_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX [IX_Clients_HealerId] ON [Clients] ([HealerId]);
CREATE INDEX [IX_Protocols_HealerId] ON [Protocols] ([HealerId]);
CREATE INDEX [IX_Sessions_UserId] ON [Sessions] ([UserId]);
CREATE INDEX [IX_Sessions_ClientId] ON [Sessions] ([ClientId]);
CREATE INDEX [IX_Sessions_ScheduledDate] ON [Sessions] ([ScheduledDate]);
CREATE INDEX [IX_Payments_ClientId] ON [Payments] ([ClientId]);
CREATE INDEX [IX_Payments_HealerId] ON [Payments] ([HealerId]);
CREATE INDEX [IX_Payments_SessionId] ON [Payments] ([SessionId]);
CREATE INDEX [IX_NurturingSessions_HealerId] ON [NurturingSessions] ([HealerId]);
CREATE INDEX [IX_NurturingSessions_Date] ON [NurturingSessions] ([Date]);
CREATE INDEX [IX_HealingNotes_ClientId] ON [HealingNotes] ([ClientId]);
CREATE INDEX [IX_ClientProtocols_ClientId] ON [ClientProtocols] ([ClientId]);
CREATE INDEX [IX_ClientProtocols_ProtocolId] ON [ClientProtocols] ([ProtocolId]);

-- Unique constraint for username
CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);

PRINT 'Healing Rays database schema created successfully!';
PRINT 'Tables created: Users, Clients, Protocols, ClientProtocols, Sessions, Payments, NurturingSessions, HealingNotes';
PRINT 'All foreign key relationships and indexes have been set up.';
