using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Services.Interfaces;
using HealingRays.Api.Models;
using System.Text.Json;

namespace HealingRays.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;

        public ClientsController(IClientService clientService)
        {
            _clientService = clientService;
        }

        [HttpGet]
        public async Task<IActionResult> GetClients([FromQuery] ClientFilterDto filter)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var clients = await _clientService.GetByHealerIdAsync(userId);

                // Apply filters
                if (filter != null)
                {
                    if (!string.IsNullOrEmpty(filter.Name))
                    {
                        clients = clients.Where(c => c.Name.Contains(filter.Name, System.StringComparison.OrdinalIgnoreCase));
                    }

                    if (filter.IsActive.HasValue)
                    {
                        clients = clients.Where(c => c.IsActive == filter.IsActive.Value);
                    }

                    if (filter.CreatedAfter.HasValue)
                    {
                        clients = clients.Where(c => c.CreatedAt >= filter.CreatedAfter.Value);
                    }

                    if (filter.CreatedBefore.HasValue)
                    {
                        clients = clients.Where(c => c.CreatedAt <= filter.CreatedBefore.Value);
                    }
                }

                // Return exact response structure for frontend compatibility
                var response = clients.Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    photo = c.Photo,
                    phone = c.Phone,
                    email = c.Email,
                    base_fee = c.BaseFee, // Keep snake_case for compatibility
                    is_active = c.IsActive,
                    healer_id = c.HealerId,
                    notes = c.Notes.Select(n => new
                    {
                        timestamp = n.Timestamp,
                        text = n.Text
                    }),
                    protocol_ids = c.ClientProtocols?.Select(cp => cp.ProtocolId).ToArray() ?? new int[0],
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                });

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClient(int id)
        {
            try
            {
                var client = await _clientService.GetByIdAsync(id);

                if (client == null)
                {
                    return NotFound(new { message = "Client not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || client.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                var response = new
                {
                    id = client.Id,
                    name = client.Name,
                    photo = client.Photo,
                    phone = client.Phone,
                    email = client.Email,
                    base_fee = client.BaseFee,
                    is_active = client.IsActive,
                    healer_id = client.HealerId,
                    notes = client.Notes.Select(n => new
                    {
                        timestamp = n.Timestamp,
                        text = n.Text
                    }),
                    protocol_ids = client.ClientProtocols?.Select(cp => cp.ProtocolId).ToArray() ?? new int[0],
                    createdAt = client.CreatedAt,
                    updatedAt = client.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateClient([FromBody] ClientCreateDto clientDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var client = new Client
                {
                    Name = clientDto.Name,
                    Photo = clientDto.Photo,
                    Phone = clientDto.Phone,
                    Email = clientDto.Email,
                    BaseFee = clientDto.BaseFee ?? 0,
                    IsActive = clientDto.IsActive ?? true,
                    HealerId = userId,
                    ClientProtocols = (clientDto.ProtocolIds ?? new int[0]).Select(pid => new ClientProtocol
                    {
                        ProtocolId = pid
                    }).ToList()
                };

                var createdClient = await _clientService.CreateAsync(client);

                var response = new
                {
                    id = createdClient.Id,
                    name = createdClient.Name,
                    photo = createdClient.Photo,
                    phone = createdClient.Phone,
                    email = createdClient.Email,
                    base_fee = createdClient.BaseFee,
                    is_active = createdClient.IsActive,
                    healer_id = createdClient.HealerId,
                    notes = new object[0],
                    protocol_ids = createdClient.ClientProtocols?.Select(cp => cp.ProtocolId).ToArray() ?? new int[0],
                    createdAt = createdClient.CreatedAt,
                    updatedAt = createdClient.UpdatedAt
                };

                return CreatedAtAction(nameof(GetClient), new { id = createdClient.Id }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, [FromBody] ClientUpdateDto clientDto)
        {
            try
            {
                var client = await _clientService.GetByIdAsync(id);

                if (client == null)
                {
                    return NotFound(new { message = "Client not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || client.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                client.Name = clientDto.Name ?? client.Name;
                client.Photo = clientDto.Photo ?? client.Photo;
                client.Phone = clientDto.Phone ?? client.Phone;
                client.Email = clientDto.Email ?? client.Email;
                client.BaseFee = clientDto.BaseFee ?? client.BaseFee;
                client.IsActive = clientDto.IsActive ?? client.IsActive;

                // Handle protocol associations through ClientProtocols
                if (clientDto.ProtocolIds != null)
                {
                    // Remove existing protocol associations
                    client.ClientProtocols?.Clear();

                    // Add new protocol associations
                    foreach (var protocolId in clientDto.ProtocolIds)
                    {
                        client.ClientProtocols?.Add(new ClientProtocol
                        {
                            ClientId = client.Id,
                            ProtocolId = protocolId
                        });
                    }
                }

                await _clientService.UpdateAsync(client);

                var response = new
                {
                    id = client.Id,
                    name = client.Name,
                    photo = client.Photo,
                    phone = client.Phone,
                    email = client.Email,
                    base_fee = client.BaseFee,
                    is_active = client.IsActive,
                    healer_id = client.HealerId,
                    notes = client.Notes?.Select(n => new
                    {
                        timestamp = n.Timestamp,
                        text = n.Text
                    }),
                    protocol_ids = client.ClientProtocols?.Select(cp => cp.ProtocolId).ToArray() ?? new int[0],
                    createdAt = client.CreatedAt,
                    updatedAt = client.UpdatedAt
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            try
            {
                var client = await _clientService.GetByIdAsync(id);

                if (client == null)
                {
                    return NotFound(new { message = "Client not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || client.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _clientService.DeleteAsync(id);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/notes")]
        public async Task<IActionResult> AddNote(int id, [FromBody] AddNoteDto noteDto)
        {
            try
            {
                var client = await _clientService.GetByIdAsync(id);

                if (client == null)
                {
                    return NotFound(new { message = "Client not found" });
                }

                // Verify ownership
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || client.HealerId != userId)
                {
                    return Unauthorized(new { message = "Access denied" });
                }

                await _clientService.AddNoteAsync(id, noteDto.Text);
                return Ok(new { message = "Note added successfully" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // DTOs for client operations
    public class ClientFilterDto
    {
        public string Name { get; set; }
        public bool? IsActive { get; set; }
        public int? HealerId { get; set; }
        public System.DateTime? CreatedAfter { get; set; }
        public System.DateTime? CreatedBefore { get; set; }
    }

    public class ClientCreateDto
    {
        public string Name { get; set; }
        public string Photo { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public decimal? BaseFee { get; set; }
        public bool? IsActive { get; set; }
        public int[] ProtocolIds { get; set; }
    }

    public class ClientUpdateDto
    {
        public string Name { get; set; }
        public string Photo { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public decimal? BaseFee { get; set; }
        public bool? IsActive { get; set; }
        public int[] ProtocolIds { get; set; }
    }

    public class AddNoteDto
    {
        public string Text { get; set; }
    }
}
