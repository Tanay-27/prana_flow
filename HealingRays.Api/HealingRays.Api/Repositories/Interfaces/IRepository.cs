using System.Collections.Generic;
using System.Threading.Tasks;

namespace HealingRays.Api.Repositories.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<T> GetByIdAsync(int id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
    }

    public interface IUserRepository : IRepository<Models.User>
    {
        Task<Models.User> GetByUsernameAsync(string username);
        Task<bool> IsUsernameTakenAsync(string username);
    }

    public interface IClientRepository : IRepository<Models.Client>
    {
        Task<IEnumerable<Models.Client>> GetByHealerIdAsync(int healerId);
        Task<IEnumerable<Models.Client>> GetActiveClientsAsync(int healerId);
    }

    public interface ISessionRepository : IRepository<Models.Session>
    {
        Task<IEnumerable<Models.Session>> GetByUserIdAsync(int userId);
        Task<IEnumerable<Models.Session>> GetByClientIdAsync(int clientId);
        Task<IEnumerable<Models.Session>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    }

    public interface IProtocolRepository : IRepository<Models.Protocol>
    {
        Task<IEnumerable<Models.Protocol>> GetByHealerIdAsync(int healerId);
        Task<IEnumerable<Models.Protocol>> GetActiveProtocolsAsync(int healerId);
    }

    public interface IPaymentRepository : IRepository<Models.Payment>
    {
        Task<IEnumerable<Models.Payment>> GetByClientIdAsync(int clientId);
        Task<IEnumerable<Models.Payment>> GetByHealerIdAsync(int healerId);
        Task<IEnumerable<Models.Payment>> GetPendingPaymentsAsync(int healerId);
    }

    public interface INurturingSessionRepository : IRepository<Models.NurturingSession>
    {
        Task<IEnumerable<Models.NurturingSession>> GetByHealerIdAsync(int healerId);
        Task<IEnumerable<Models.NurturingSession>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    }

    public interface IHealingNoteRepository : IRepository<Models.HealingNote>
    {
        Task<IEnumerable<Models.HealingNote>> GetByClientIdAsync(int clientId);
    }
}
