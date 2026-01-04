using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealingRays.Api.Models
{
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Healer { get; set; }
        public ICollection<ClientProtocol> ClientProtocols { get; set; }
        public ICollection<Session> Sessions { get; set; }
    }
}
