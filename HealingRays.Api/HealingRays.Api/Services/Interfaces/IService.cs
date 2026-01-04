using System.Threading.Tasks;
using HealingRays.Api.DTOs.Auth;

namespace HealingRays.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        string GenerateJwtToken(Models.User user);
    }

    public interface IUserService
    {
        Task<Models.User> GetByIdAsync(int id);
        Task<IEnumerable<Models.User>> GetAllAsync();
        Task<Models.User> CreateAsync(Models.User user);
        Task UpdateAsync(Models.User user);
        Task DeleteAsync(int id);
    }

    public interface IClientService
    {
        Task<Models.Client> GetByIdAsync(int id);
        Task<IEnumerable<Models.Client>> GetByHealerIdAsync(int healerId);
        Task<Models.Client> CreateAsync(Models.Client client);
        Task UpdateAsync(Models.Client client);
        Task DeleteAsync(int id);
        Task AddNoteAsync(int clientId, string noteText);
    }

    public interface ISessionService
    {
        Task<Models.Session> GetByIdAsync(int id);
        Task<IEnumerable<Models.Session>> GetByUserIdAsync(int userId);
        Task<IEnumerable<Models.Session>> GetByClientIdAsync(int clientId);
        Task<Models.Session> CreateAsync(Models.Session session);
        Task UpdateAsync(Models.Session session);
        Task DeleteAsync(int id);
    }

    public interface IProtocolService
    {
        Task<Models.Protocol> GetByIdAsync(int id);
        Task<IEnumerable<Models.Protocol>> GetByHealerIdAsync(int healerId);
        Task<Models.Protocol> CreateAsync(Models.Protocol protocol);
        Task UpdateAsync(Models.Protocol protocol);
        Task DeleteAsync(int id);
    }

    public interface IPaymentService
    {
        Task<Models.Payment> GetByIdAsync(int id);
        Task<IEnumerable<Models.Payment>> GetByClientIdAsync(int clientId);
        Task<IEnumerable<Models.Payment>> GetByHealerIdAsync(int healerId);
        Task<Models.Payment> CreateAsync(Models.Payment payment);
        Task UpdateAsync(Models.Payment payment);
        Task DeleteAsync(int id);
    }

    public interface INurturingSessionService
    {
        Task<Models.NurturingSession> GetByIdAsync(int id);
        Task<IEnumerable<Models.NurturingSession>> GetByHealerIdAsync(int healerId);
        Task<Models.NurturingSession> CreateAsync(Models.NurturingSession session);
        Task UpdateAsync(Models.NurturingSession session);
        Task DeleteAsync(int id);
    }
}
