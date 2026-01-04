using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealingRays.Api.Models
{
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; }
        public Client Client { get; set; }
    }
}
