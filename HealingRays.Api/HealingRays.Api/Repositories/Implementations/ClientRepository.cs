using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class ClientRepository : Repository<Models.Client>, IClientRepository
    {
        public ClientRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.Client>> GetByHealerIdAsync(int healerId)
        {
            return await _dbSet
                .Where(c => c.HealerId == healerId)
                .Include(c => c.Notes)
                .Include(c => c.ClientProtocols)
                    .ThenInclude(cp => cp.Protocol)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Client>> GetActiveClientsAsync(int healerId)
        {
            return await _dbSet
                .Where(c => c.HealerId == healerId && c.IsActive)
                .Include(c => c.Notes)
                .Include(c => c.ClientProtocols)
                    .ThenInclude(cp => cp.Protocol)
                .ToListAsync();
        }

        public override async Task<Models.Client> GetByIdAsync(int id)
        {
            return await _dbSet
                .Include(c => c.Notes)
                .Include(c => c.ClientProtocols)
                    .ThenInclude(cp => cp.Protocol)
                .Include(c => c.Sessions)
                .Include(c => c.Payments)
                .FirstOrDefaultAsync(c => c.Id == id);
        }
    }
}
