using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealingRays.Api.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Username { get; set; }

        public string Password { get; set; } // Will be hashed

        public string Role { get; set; } = "user";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Client> Clients { get; set; }
        public ICollection<Session> Sessions { get; set; }
        public ICollection<Protocol> Protocols { get; set; }
        public ICollection<Payment> Payments { get; set; }
        public ICollection<NurturingSession> NurturingSessions { get; set; }
    }

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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Healer { get; set; }
        public ICollection<HealingNote> Notes { get; set; }
        public ICollection<ClientProtocol> ClientProtocols { get; set; }
        public ICollection<Session> Sessions { get; set; }
        public ICollection<Payment> Payments { get; set; }
    }

    public class HealingNote
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required]
        public string Text { get; set; }

        // Navigation properties
        public Client Client { get; set; }
    }

    public class ClientProtocol
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public int ProtocolId { get; set; }

        // Navigation properties
        public Client Client { get; set; }
        public Protocol Protocol { get; set; }
    }
}
