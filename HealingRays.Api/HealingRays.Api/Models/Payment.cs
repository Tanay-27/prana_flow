using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealingRays.Api.Models
{
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Session Session { get; set; }
        public Client Client { get; set; }
        public User Healer { get; set; }
    }
}
