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
    public class ProtocolsController : ControllerBase
    {
        private readonly IProtocolService _protocolService;

        public ProtocolsController(IProtocolService protocolService)
        {
            _protocolService = protocolService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProtocols()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var protocols = await _protocolService.GetByHealerIdAsync(userId);

                var response = protocols.Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    notes = p.Notes,
                    keywords = JsonSerializer.Deserialize<string[]>(p.Keywords ?? "[]"),
                    attachments = JsonSerializer.Deserialize<string[]>(p.Attachments ?? "[]"),
                    healer_id = p.HealerId,
                    is_active = p.IsActive,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt
                });

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProtocol(int id)
        {
            try
            {
                var protocol = await _protocolService.GetByIdAsync(id);

                if (protocol == null)
                {
                    return NotFound(new { message = "Protocol not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || protocol.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                var response = new
                {
                    id = protocol.Id,
                    name = protocol.Name,
                    notes = protocol.Notes,
                    keywords = JsonSerializer.Deserialize<string[]>(protocol.Keywords ?? "[]"),
                    attachments = JsonSerializer.Deserialize<string[]>(protocol.Attachments ?? "[]"),
                    healer_id = protocol.HealerId,
                    is_active = protocol.IsActive,
                    createdAt = protocol.CreatedAt,
                    updatedAt = protocol.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProtocol([FromBody] ProtocolCreateDto protocolDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var protocol = new Protocol
                {
                    Name = protocolDto.Name,
                    Notes = protocolDto.Notes,
                    Keywords = JsonSerializer.Serialize(protocolDto.Keywords ?? new string[0]),
                    Attachments = JsonSerializer.Serialize(protocolDto.Attachments ?? new string[0]),
                    HealerId = userId,
                    IsActive = protocolDto.IsActive ?? true
                };

                var createdProtocol = await _protocolService.CreateAsync(protocol);

                var response = new
                {
                    id = createdProtocol.Id,
                    name = createdProtocol.Name,
                    notes = createdProtocol.Notes,
                    keywords = JsonSerializer.Deserialize<string[]>(createdProtocol.Keywords ?? "[]"),
                    attachments = JsonSerializer.Deserialize<string[]>(createdProtocol.Attachments ?? "[]"),
                    healer_id = createdProtocol.HealerId,
                    is_active = createdProtocol.IsActive,
                    createdAt = createdProtocol.CreatedAt,
                    updatedAt = createdProtocol.UpdatedAt
                };

                return CreatedAtAction(nameof(GetProtocol), new { id = createdProtocol.Id }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProtocol(int id, [FromBody] ProtocolUpdateDto protocolDto)
        {
            try
            {
                var protocol = await _protocolService.GetByIdAsync(id);

                if (protocol == null)
                {
                    return NotFound(new { message = "Protocol not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || protocol.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                protocol.Name = protocolDto.Name ?? protocol.Name;
                protocol.Notes = protocolDto.Notes ?? protocol.Notes;
                protocol.Keywords = protocolDto.Keywords != null ? JsonSerializer.Serialize(protocolDto.Keywords) : protocol.Keywords;
                protocol.Attachments = protocolDto.Attachments != null ? JsonSerializer.Serialize(protocolDto.Attachments) : protocol.Attachments;
                protocol.IsActive = protocolDto.IsActive ?? protocol.IsActive;

                await _protocolService.UpdateAsync(protocol);

                var response = new
                {
                    id = protocol.Id,
                    name = protocol.Name,
                    notes = protocol.Notes,
                    keywords = JsonSerializer.Deserialize<string[]>(protocol.Keywords ?? "[]"),
                    attachments = JsonSerializer.Deserialize<string[]>(protocol.Attachments ?? "[]"),
                    healer_id = protocol.HealerId,
                    is_active = protocol.IsActive,
                    createdAt = protocol.CreatedAt,
                    updatedAt = protocol.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProtocol(int id)
        {
            try
            {
                var protocol = await _protocolService.GetByIdAsync(id);

                if (protocol == null)
                {
                    return NotFound(new { message = "Protocol not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || protocol.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _protocolService.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // DTOs for protocol operations
    public class ProtocolCreateDto
    {
        public string Name { get; set; }
        public string Notes { get; set; }
        public string[] Keywords { get; set; }
        public string[] Attachments { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ProtocolUpdateDto
    {
        public string Name { get; set; }
        public string Notes { get; set; }
        public string[] Keywords { get; set; }
        public string[] Attachments { get; set; }
        public bool? IsActive { get; set; }
    }
}
