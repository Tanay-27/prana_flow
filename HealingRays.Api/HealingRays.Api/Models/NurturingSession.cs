using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealingRays.Api.Models
{
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Healer { get; set; }
    }
}
