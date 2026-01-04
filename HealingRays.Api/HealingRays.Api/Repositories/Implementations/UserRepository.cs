using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;

namespace HealingRays.Api.Repositories.Implementations
{
    public class UserRepository : Repository<Models.User>, IUserRepository
    {
        public UserRepository(HealingRaysDbContext context) : base(context) { }

        public async Task<Models.User> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<bool> IsUsernameTakenAsync(string username)
        {
            return await _dbSet.AnyAsync(u => u.Username == username);
        }
    }
}
