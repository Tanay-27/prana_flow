using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class ProtocolRepository : Repository<Models.Protocol>, IProtocolRepository
    {
        public ProtocolRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.Protocol>> GetByHealerIdAsync(int healerId)
        {
            return await _dbSet
                .Where(p => p.HealerId == healerId)
                .Include(p => p.Healer)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Protocol>> GetActiveProtocolsAsync(int healerId)
        {
            return await _dbSet
                .Where(p => p.HealerId == healerId && p.IsActive)
                .Include(p => p.Healer)
                .ToListAsync();
        }
    }
}
