using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class PaymentRepository : Repository<Models.Payment>, IPaymentRepository
    {
        public PaymentRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<IEnumerable<Models.Payment>> GetByClientIdAsync(int clientId)
        {
            return await _dbSet
                .Where(p => p.ClientId == clientId)
                .Include(p => p.Client)
                .Include(p => p.Session)
                .Include(p => p.Healer)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Payment>> GetByHealerIdAsync(int healerId)
        {
            return await _dbSet
                .Where(p => p.HealerId == healerId)
                .Include(p => p.Client)
                .Include(p => p.Session)
                .ToListAsync();
        }

        public async Task<IEnumerable<Models.Payment>> GetPendingPaymentsAsync(int healerId)
        {
            return await _dbSet
                .Where(p => p.HealerId == healerId && p.Status == "Pending")
                .Include(p => p.Client)
                .Include(p => p.Session)
                .ToListAsync();
        }
    }
}
