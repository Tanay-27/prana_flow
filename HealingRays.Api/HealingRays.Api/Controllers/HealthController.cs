using Microsoft.AspNetCore.Mvc;

namespace HealingRays.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = System.DateTime.UtcNow,
                version = "1.0.0",
                message = "Healing Rays API is running successfully"
            });
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "pong", timestamp = System.DateTime.UtcNow });
        }
    }
}
