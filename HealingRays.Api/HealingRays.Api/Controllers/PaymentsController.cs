using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealingRays.Api.Services.Interfaces;
using HealingRays.Api.Models;

namespace HealingRays.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPayments()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var payments = await _paymentService.GetByHealerIdAsync(userId);

                var response = payments.Select(p => new
                {
                    id = p.Id,
                    session_id = p.SessionId,
                    client_id = p.ClientId,
                    amount_inr = p.AmountInr,
                    mode = p.Mode,
                    status = p.Status,
                    paid_at = p.PaidAt,
                    healer_id = p.HealerId,
                    is_active = p.IsActive,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt,
                    client = p.Client != null ? new
                    {
                        id = p.Client.Id,
                        name = p.Client.Name,
                        phone = p.Client.Phone,
                        email = p.Client.Email
                    } : null,
                    session = p.Session != null ? new
                    {
                        id = p.Session.Id,
                        type = p.Session.Type,
                        scheduled_date = p.Session.ScheduledDate
                    } : null
                });

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPayment(int id)
        {
            try
            {
                var payment = await _paymentService.GetByIdAsync(id);

                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || payment.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                var response = new
                {
                    id = payment.Id,
                    session_id = payment.SessionId,
                    client_id = payment.ClientId,
                    amount_inr = payment.AmountInr,
                    mode = payment.Mode,
                    status = payment.Status,
                    paid_at = payment.PaidAt,
                    healer_id = payment.HealerId,
                    is_active = payment.IsActive,
                    createdAt = payment.CreatedAt,
                    updatedAt = payment.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateDto paymentDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var payment = new Payment
                {
                    SessionId = paymentDto.SessionId,
                    ClientId = paymentDto.ClientId,
                    AmountInr = paymentDto.AmountInr,
                    Mode = paymentDto.Mode,
                    Status = paymentDto.Status ?? "Pending",
                    PaidAt = paymentDto.PaidAt,
                    HealerId = userId,
                    IsActive = paymentDto.IsActive ?? true
                };

                var createdPayment = await _paymentService.CreateAsync(payment);

                var response = new
                {
                    id = createdPayment.Id,
                    session_id = createdPayment.SessionId,
                    client_id = createdPayment.ClientId,
                    amount_inr = createdPayment.AmountInr,
                    mode = createdPayment.Mode,
                    status = createdPayment.Status,
                    paid_at = createdPayment.PaidAt,
                    healer_id = createdPayment.HealerId,
                    is_active = createdPayment.IsActive,
                    createdAt = createdPayment.CreatedAt,
                    updatedAt = createdPayment.UpdatedAt
                };

                return CreatedAtAction(nameof(GetPayment), new { id = createdPayment.Id }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, [FromBody] PaymentUpdateDto paymentDto)
        {
            try
            {
                var payment = await _paymentService.GetByIdAsync(id);

                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || payment.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                payment.SessionId = paymentDto.SessionId ?? payment.SessionId;
                payment.ClientId = paymentDto.ClientId ?? payment.ClientId;
                payment.AmountInr = paymentDto.AmountInr ?? payment.AmountInr;
                payment.Mode = paymentDto.Mode ?? payment.Mode;
                payment.Status = paymentDto.Status ?? payment.Status;
                payment.PaidAt = paymentDto.PaidAt ?? payment.PaidAt;
                payment.IsActive = paymentDto.IsActive ?? payment.IsActive;

                await _paymentService.UpdateAsync(payment);

                var response = new
                {
                    id = payment.Id,
                    session_id = payment.SessionId,
                    client_id = payment.ClientId,
                    amount_inr = payment.AmountInr,
                    mode = payment.Mode,
                    status = payment.Status,
                    paid_at = payment.PaidAt,
                    healer_id = payment.HealerId,
                    is_active = payment.IsActive,
                    createdAt = payment.CreatedAt,
                    updatedAt = payment.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            try
            {
                var payment = await _paymentService.GetByIdAsync(id);

                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || payment.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _paymentService.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // DTOs for payment operations
    public class PaymentCreateDto
    {
        public int? SessionId { get; set; }
        public int ClientId { get; set; }
        public decimal AmountInr { get; set; }
        public string Mode { get; set; } // "Cash", "UPI", "Bank"
        public string Status { get; set; }
        public System.DateTime? PaidAt { get; set; }
        public bool? IsActive { get; set; }
    }

    public class PaymentUpdateDto
    {
        public int? SessionId { get; set; }
        public int? ClientId { get; set; }
        public decimal? AmountInr { get; set; }
        public string Mode { get; set; }
        public string Status { get; set; }
        public System.DateTime? PaidAt { get; set; }
        public bool? IsActive { get; set; }
    }
}
