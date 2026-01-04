using System.Collections.Generic;
using System.Threading.Tasks;
using HealingRays.Api.Repositories.Interfaces;
using HealingRays.Api.Services.Interfaces;
using HealingRays.Api.Models;

namespace HealingRays.Api.Services.Implementations
{
    public class SessionService : ISessionService
    {
        private readonly ISessionRepository _sessionRepository;

        public SessionService(ISessionRepository sessionRepository)
        {
            _sessionRepository = sessionRepository;
        }

        public async Task<Session> GetByIdAsync(int id)
        {
            return await _sessionRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Session>> GetByUserIdAsync(int userId)
        {
            return await _sessionRepository.GetByUserIdAsync(userId);
        }

        public async Task<IEnumerable<Session>> GetByClientIdAsync(int clientId)
        {
            return await _sessionRepository.GetByClientIdAsync(clientId);
        }

        public async Task<Session> CreateAsync(Session session)
        {
            session.CreatedAt = System.DateTime.UtcNow;
            session.UpdatedAt = System.DateTime.UtcNow;
            return await _sessionRepository.AddAsync(session);
        }

        public async Task UpdateAsync(Session session)
        {
            session.UpdatedAt = System.DateTime.UtcNow;
            await _sessionRepository.UpdateAsync(session);
        }

        public async Task DeleteAsync(int id)
        {
            await _sessionRepository.DeleteAsync(id);
        }
    }
}
