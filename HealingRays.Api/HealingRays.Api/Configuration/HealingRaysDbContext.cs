using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Models;

namespace HealingRays.Api.Configuration
{
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
        public DbSet<ClientProtocol> ClientProtocols { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints
            modelBuilder.Entity<Client>()
                .HasOne(c => c.Healer)
                .WithMany(u => u.Clients)
                .HasForeignKey(c => c.HealerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Session>()
                .HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Session>()
                .HasOne(s => s.Client)
                .WithMany(c => c.Sessions)
                .HasForeignKey(s => s.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Protocol>()
                .HasOne(p => p.Healer)
                .WithMany(u => u.Protocols)
                .HasForeignKey(p => p.HealerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Session)
                .WithMany()
                .HasForeignKey(p => p.SessionId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Client)
                .WithMany(c => c.Payments)
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Healer)
                .WithMany(u => u.Payments)
                .HasForeignKey(p => p.HealerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<NurturingSession>()
                .HasOne(ns => ns.Healer)
                .WithMany(u => u.NurturingSessions)
                .HasForeignKey(ns => ns.HealerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HealingNote>()
                .HasOne(hn => hn.Client)
                .WithMany(c => c.Notes)
                .HasForeignKey(hn => hn.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClientProtocol>()
                .HasOne(cp => cp.Client)
                .WithMany(c => c.ClientProtocols)
                .HasForeignKey(cp => cp.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClientProtocol>()
                .HasOne(cp => cp.Protocol)
                .WithMany(p => p.ClientProtocols)
                .HasForeignKey(cp => cp.ProtocolId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Configure default values
            modelBuilder.Entity<User>()
                .Property(u => u.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            modelBuilder.Entity<User>()
                .Property(u => u.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Similar default value configurations for other entities...
        }
    }
}
