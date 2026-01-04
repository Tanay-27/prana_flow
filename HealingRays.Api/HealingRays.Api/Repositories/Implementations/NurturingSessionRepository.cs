using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class NurturingSessionRepository : Repository<Models.NurturingSession>, INurturingSessionRepository
    {
        public NurturingSessionRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.NurturingSession>> GetByHealerIdAsync(int healerId)
        {
            return await _dbSet
                .Where(ns => ns.HealerId == healerId)
                .Include(ns => ns.Healer)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.NurturingSession>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(ns => ns.Date >= startDate && ns.Date <= endDate)
                .Include(ns => ns.Healer)
                .ToListAsync();
        }
    }

    public class HealingNoteRepository : Repository<Models.HealingNote>, IHealingNoteRepository
    {
        public HealingNoteRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.HealingNote>> GetByClientIdAsync(int clientId)
        {
            return await _dbSet
                .Where(hn => hn.ClientId == clientId)
                .Include(hn => hn.Client)
                .OrderByDescending(hn => hn.Timestamp)
                .ToListAsync();
        }
    }
}
