using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealingRays.Api.Services.Interfaces;
using HealingRays.Api.Models;
using System.Text.Json;

namespace HealingRays.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NurturingSessionsController : ControllerBase
    {
        private readonly INurturingSessionService _nurturingSessionService;

        public NurturingSessionsController(INurturingSessionService nurturingSessionService)
        {
            _nurturingSessionService = nurturingSessionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNurturingSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var sessions = await _nurturingSessionService.GetByHealerIdAsync(userId);

                var response = sessions.Select(ns => new
                {
                    id = ns.Id,
                    name = ns.Name,
                    date = ns.Date,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(ns.ScheduleSlots ?? "[]"),
                    coordinator = ns.Coordinator,
                    payment_details = ns.PaymentDetails,
                    status = ns.Status,
                    recording_available_till = ns.RecordingAvailableTill,
                    attachments = JsonSerializer.Deserialize<object[]>(ns.Attachments ?? "[]"),
                    healer_id = ns.HealerId,
                    is_active = ns.IsActive,
                    createdAt = ns.CreatedAt,
                    updatedAt = ns.UpdatedAt
                });

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNurturingSession(int id)
        {
            try
            {
                var session = await _nurturingSessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Nurturing session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                var response = new
                {
                    id = session.Id,
                    name = session.Name,
                    date = session.Date,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(session.ScheduleSlots ?? "[]"),
                    coordinator = session.Coordinator,
                    payment_details = session.PaymentDetails,
                    status = session.Status,
                    recording_available_till = session.RecordingAvailableTill,
                    attachments = JsonSerializer.Deserialize<object[]>(session.Attachments ?? "[]"),
                    healer_id = session.HealerId,
                    is_active = session.IsActive,
                    createdAt = session.CreatedAt,
                    updatedAt = session.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateNurturingSession([FromBody] NurturingSessionCreateDto sessionDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var session = new NurturingSession
                {
                    Name = sessionDto.Name,
                    Date = sessionDto.Date,
                    ScheduleSlots = JsonSerializer.Serialize(sessionDto.ScheduleSlots ?? new object[0]),
                    Coordinator = sessionDto.Coordinator,
                    PaymentDetails = sessionDto.PaymentDetails,
                    Status = sessionDto.Status ?? "Planned",
                    RecordingAvailableTill = sessionDto.RecordingAvailableTill,
                    Attachments = JsonSerializer.Serialize(sessionDto.Attachments ?? new object[0]),
                    HealerId = userId,
                    IsActive = sessionDto.IsActive ?? true
                };

                var createdSession = await _nurturingSessionService.CreateAsync(session);

                var response = new
                {
                    id = createdSession.Id,
                    name = createdSession.Name,
                    date = createdSession.Date,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(createdSession.ScheduleSlots ?? "[]"),
                    coordinator = createdSession.Coordinator,
                    payment_details = createdSession.PaymentDetails,
                    status = createdSession.Status,
                    recording_available_till = createdSession.RecordingAvailableTill,
                    attachments = JsonSerializer.Deserialize<object[]>(createdSession.Attachments ?? "[]"),
                    healer_id = createdSession.HealerId,
                    is_active = createdSession.IsActive,
                    createdAt = createdSession.CreatedAt,
                    updatedAt = createdSession.UpdatedAt
                };

                return CreatedAtAction(nameof(GetNurturingSession), new { id = createdSession.Id }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNurturingSession(int id, [FromBody] NurturingSessionUpdateDto sessionDto)
        {
            try
            {
                var session = await _nurturingSessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Nurturing session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                session.Name = sessionDto.Name ?? session.Name;
                session.Date = sessionDto.Date ?? session.Date;
                session.ScheduleSlots = sessionDto.ScheduleSlots != null ? JsonSerializer.Serialize(sessionDto.ScheduleSlots) : session.ScheduleSlots;
                session.Coordinator = sessionDto.Coordinator ?? session.Coordinator;
                session.PaymentDetails = sessionDto.PaymentDetails ?? session.PaymentDetails;
                session.Status = sessionDto.Status ?? session.Status;
                session.RecordingAvailableTill = sessionDto.RecordingAvailableTill ?? session.RecordingAvailableTill;
                session.Attachments = sessionDto.Attachments != null ? JsonSerializer.Serialize(sessionDto.Attachments) : session.Attachments;
                session.IsActive = sessionDto.IsActive ?? session.IsActive;

                await _nurturingSessionService.UpdateAsync(session);

                var response = new
                {
                    id = session.Id,
                    name = session.Name,
                    date = session.Date,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(session.ScheduleSlots ?? "[]"),
                    coordinator = session.Coordinator,
                    payment_details = session.PaymentDetails,
                    status = session.Status,
                    recording_available_till = session.RecordingAvailableTill,
                    attachments = JsonSerializer.Deserialize<object[]>(session.Attachments ?? "[]"),
                    healer_id = session.HealerId,
                    is_active = session.IsActive,
                    createdAt = session.CreatedAt,
                    updatedAt = session.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNurturingSession(int id)
        {
            try
            {
                var session = await _nurturingSessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Nurturing session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _nurturingSessionService.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // DTOs for nurturing session operations
    public class NurturingSessionCreateDto
    {
        public string Name { get; set; }
        public System.DateTime Date { get; set; }
        public object[] ScheduleSlots { get; set; } = new object[0];
        public string Coordinator { get; set; }
        public string PaymentDetails { get; set; }
        public string Status { get; set; } = "scheduled";
        public System.DateTime? RecordingAvailableTill { get; set; }
        public object[] Attachments { get; set; } = new object[0];
        public bool? IsActive { get; set; } = true;
    }

    public class NurturingSessionUpdateDto
    {
        public string Name { get; set; }
        public System.DateTime? Date { get; set; }
        public object[] ScheduleSlots { get; set; }
        public string Coordinator { get; set; }
        public string PaymentDetails { get; set; }
        public string Status { get; set; }
        public System.DateTime? RecordingAvailableTill { get; set; }
        public object[] Attachments { get; set; }
        public bool? IsActive { get; set; }
    }
}
