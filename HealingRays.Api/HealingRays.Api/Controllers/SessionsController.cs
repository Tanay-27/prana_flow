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
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public SessionsController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSessions([FromQuery] SessionFilterDto filter)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                IEnumerable<Session> sessions;

                if (filter.ClientId.HasValue)
                {
                    sessions = await _sessionService.GetByClientIdAsync(filter.ClientId.Value);
                }
                else
                {
                    sessions = await _sessionService.GetByUserIdAsync(userId);
                }

                // Apply filters
                if (filter != null)
                {
                    if (!string.IsNullOrEmpty(filter.Type))
                    {
                        sessions = sessions.Where(s => s.Type == filter.Type);
                    }

                    if (!string.IsNullOrEmpty(filter.Status))
                    {
                        sessions = sessions.Where(s => s.Status == filter.Status);
                    }

                    if (filter.ScheduledAfter.HasValue)
                    {
                        sessions = sessions.Where(s => s.ScheduledDate >= filter.ScheduledAfter.Value);
                    }

                    if (filter.ScheduledBefore.HasValue)
                    {
                        sessions = sessions.Where(s => s.ScheduledDate <= filter.ScheduledBefore.Value);
                    }

                    if (filter.SelfSession.HasValue)
                    {
                        sessions = sessions.Where(s => s.SelfSession == filter.SelfSession.Value);
                    }
                }

                // Return exact response structure for frontend compatibility
                var response = sessions.Select(s => new
                {
                    id = s.Id,
                    type = s.Type,
                    user_id = s.UserId,
                    client_id = s.ClientId,
                    protocol_ids = JsonSerializer.Deserialize<int[]>(s.ProtocolIds ?? "[]"),
                    scheduled_date = s.ScheduledDate,
                    start_time = s.StartTime,
                    end_time = s.EndTime,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(s.ScheduleSlots ?? "[]"),
                    status = s.Status,
                    notes = s.Notes,
                    fee = s.Fee,
                    attachments = JsonSerializer.Deserialize<object[]>(s.Attachments ?? "[]"),
                    self_session = s.SelfSession,
                    is_active = s.IsActive,
                    createdAt = s.CreatedAt,
                    updatedAt = s.UpdatedAt,
                    client = s.Client != null ? new
                    {
                        id = s.Client.Id,
                        name = s.Client.Name,
                        phone = s.Client.Phone,
                        email = s.Client.Email
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
        public async Task<IActionResult> GetSession(int id)
        {
            try
            {
                var session = await _sessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.UserId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                var response = new
                {
                    id = session.Id,
                    type = session.Type,
                    user_id = session.UserId,
                    client_id = session.ClientId,
                    protocol_ids = JsonSerializer.Deserialize<int[]>(session.ProtocolIds ?? "[]"),
                    scheduled_date = session.ScheduledDate,
                    start_time = session.StartTime,
                    end_time = session.EndTime,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(session.ScheduleSlots ?? "[]"),
                    status = session.Status,
                    notes = session.Notes,
                    fee = session.Fee,
                    attachments = JsonSerializer.Deserialize<object[]>(session.Attachments ?? "[]"),
                    self_session = session.SelfSession,
                    is_active = session.IsActive,
                    createdAt = session.CreatedAt,
                    updatedAt = session.UpdatedAt,
                    client = session.Client != null ? new
                    {
                        id = session.Client.Id,
                        name = session.Client.Name,
                        phone = session.Client.Phone,
                        email = session.Client.Email
                    } : null
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateSession([FromBody] SessionCreateDto sessionDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var session = new Session
                {
                    Type = sessionDto.Type,
                    UserId = userId,
                    ClientId = sessionDto.ClientId,
                    ProtocolIds = JsonSerializer.Serialize(sessionDto.ProtocolIds ?? new int[0]),
                    ScheduledDate = sessionDto.ScheduledDate,
                    StartTime = sessionDto.StartTime,
                    EndTime = sessionDto.EndTime,
                    ScheduleSlots = JsonSerializer.Serialize(sessionDto.ScheduleSlots ?? new object[0]),
                    Status = sessionDto.Status ?? "scheduled",
                    Notes = sessionDto.Notes,
                    Fee = sessionDto.Fee ?? 0,
                    Attachments = JsonSerializer.Serialize(sessionDto.Attachments ?? new object[0]),
                    SelfSession = sessionDto.SelfSession ?? false,
                    IsActive = sessionDto.IsActive ?? true
                };

                var createdSession = await _sessionService.CreateAsync(session);

                var response = new
                {
                    id = createdSession.Id,
                    type = createdSession.Type,
                    user_id = createdSession.UserId,
                    client_id = createdSession.ClientId,
                    protocol_ids = JsonSerializer.Deserialize<int[]>(createdSession.ProtocolIds ?? "[]"),
                    scheduled_date = createdSession.ScheduledDate,
                    start_time = createdSession.StartTime,
                    end_time = createdSession.EndTime,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(createdSession.ScheduleSlots ?? "[]"),
                    status = createdSession.Status,
                    notes = createdSession.Notes,
                    fee = createdSession.Fee,
                    attachments = JsonSerializer.Deserialize<object[]>(createdSession.Attachments ?? "[]"),
                    self_session = createdSession.SelfSession,
                    is_active = createdSession.IsActive,
                    createdAt = createdSession.CreatedAt,
                    updatedAt = createdSession.UpdatedAt
                };

                return CreatedAtAction(nameof(GetSession), new { id = createdSession.Id }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] SessionUpdateDto sessionDto)
        {
            try
            {
                var session = await _sessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.UserId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                session.Type = sessionDto.Type ?? session.Type;
                session.ClientId = sessionDto.ClientId ?? session.ClientId;
                session.ProtocolIds = sessionDto.ProtocolIds != null ? JsonSerializer.Serialize(sessionDto.ProtocolIds) : session.ProtocolIds;
                session.ScheduledDate = sessionDto.ScheduledDate ?? session.ScheduledDate;
                session.StartTime = sessionDto.StartTime ?? session.StartTime;
                session.EndTime = sessionDto.EndTime ?? session.EndTime;
                session.ScheduleSlots = sessionDto.ScheduleSlots != null ? JsonSerializer.Serialize(sessionDto.ScheduleSlots) : session.ScheduleSlots;
                session.Status = sessionDto.Status ?? session.Status;
                session.Notes = sessionDto.Notes ?? session.Notes;
                session.Fee = sessionDto.Fee ?? session.Fee;
                session.Attachments = sessionDto.Attachments != null ? JsonSerializer.Serialize(sessionDto.Attachments) : session.Attachments;
                session.SelfSession = sessionDto.SelfSession ?? session.SelfSession;
                session.IsActive = sessionDto.IsActive ?? session.IsActive;

                await _sessionService.UpdateAsync(session);

                var response = new
                {
                    id = session.Id,
                    type = session.Type,
                    user_id = session.UserId,
                    client_id = session.ClientId,
                    protocol_ids = JsonSerializer.Deserialize<int[]>(session.ProtocolIds ?? "[]"),
                    scheduled_date = session.ScheduledDate,
                    start_time = session.StartTime,
                    end_time = session.EndTime,
                    schedule_slots = JsonSerializer.Deserialize<object[]>(session.ScheduleSlots ?? "[]"),
                    status = session.Status,
                    notes = session.Notes,
                    fee = session.Fee,
                    attachments = JsonSerializer.Deserialize<object[]>(session.Attachments ?? "[]"),
                    self_session = session.SelfSession,
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
        public async Task<IActionResult> DeleteSession(int id)
        {
            try
            {
                var session = await _sessionService.GetByIdAsync(id);

                if (session == null)
                {
                    return NotFound(new { message = "Session not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || session.UserId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _sessionService.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // DTOs for session operations
    public class SessionFilterDto
    {
        public string Type { get; set; } // "healing" or "nurturing"
        public string Status { get; set; }
        public int? ClientId { get; set; }
        public int? UserId { get; set; }
        public System.DateTime? ScheduledAfter { get; set; }
        public System.DateTime? ScheduledBefore { get; set; }
        public bool? SelfSession { get; set; }
    }

    public class SessionCreateDto
    {
        public string Type { get; set; }
        public int? ClientId { get; set; }
        public int[] ProtocolIds { get; set; }
        public System.DateTime ScheduledDate { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public object[] ScheduleSlots { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public decimal? Fee { get; set; }
        public object[] Attachments { get; set; }
        public bool? SelfSession { get; set; }
        public bool? IsActive { get; set; }
    }

    public class SessionUpdateDto
    {
        public string Type { get; set; }
        public int? ClientId { get; set; }
        public int[] ProtocolIds { get; set; }
        public System.DateTime? ScheduledDate { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public object[] ScheduleSlots { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public decimal? Fee { get; set; }
        public object[] Attachments { get; set; }
        public bool? SelfSession { get; set; }
        public bool? IsActive { get; set; }
    }
}
