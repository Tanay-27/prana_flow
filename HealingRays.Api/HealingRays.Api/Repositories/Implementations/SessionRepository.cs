using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class SessionRepository : Repository<Models.Session>, ISessionRepository
    {
        public SessionRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.Session>> GetByUserIdAsync(int userId)
        {
            return await _dbSet
                .Where(s => s.UserId == userId)
                .Include(s => s.Client)
                .Include(s => s.User)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Session>> GetByClientIdAsync(int clientId)
        {
            return await _dbSet
                .Where(s => s.ClientId == clientId)
                .Include(s => s.Client)
                .Include(s => s.User)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Session>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(s => s.ScheduledDate >= startDate && s.ScheduledDate <= endDate)
                .Include(s => s.Client)
                .Include(s => s.User)
                .ToListAsync();
        }
    }
}
