using System.Collections.Generic;
using System.Threading.Tasks;
using HealingRays.Api.Repositories.Interfaces;
using HealingRays.Api.Services.Interfaces;

namespace HealingRays.Api.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<Models.User> GetByIdAsync(int id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Models.User>> GetAllAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task<Models.User> CreateAsync(Models.User user)
        {
            user.CreatedAt = System.DateTime.UtcNow;
            user.UpdatedAt = System.DateTime.UtcNow;
            return await _userRepository.AddAsync(user);
        }

        public async Task UpdateAsync(Models.User user)
        {
            user.UpdatedAt = System.DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
        }

        public async Task DeleteAsync(int id)
        {
            await _userRepository.DeleteAsync(id);
        }
    }

    public class ProtocolService : IProtocolService
    {
        private readonly IProtocolRepository _protocolRepository;

        public ProtocolService(IProtocolRepository protocolRepository)
        {
            _protocolRepository = protocolRepository;
        }

        public async Task<Models.Protocol> GetByIdAsync(int id)
        {
            return await _protocolRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Models.Protocol>> GetByHealerIdAsync(int healerId)
        {
            return await _protocolRepository.GetByHealerIdAsync(healerId);
        }

        public async Task<Models.Protocol> CreateAsync(Models.Protocol protocol)
        {
            protocol.CreatedAt = System.DateTime.UtcNow;
            protocol.UpdatedAt = System.DateTime.UtcNow;
            return await _protocolRepository.AddAsync(protocol);
        }

        public async Task UpdateAsync(Models.Protocol protocol)
        {
            protocol.UpdatedAt = System.DateTime.UtcNow;
            await _protocolRepository.UpdateAsync(protocol);
        }

        public async Task DeleteAsync(int id)
        {
            await _protocolRepository.DeleteAsync(id);
        }
    }

    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;

        public PaymentService(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        public async Task<Models.Payment> GetByIdAsync(int id)
        {
            return await _paymentRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Models.Payment>> GetByClientIdAsync(int clientId)
        {
            return await _paymentRepository.GetByClientIdAsync(clientId);
        }

        public async Task<IEnumerable<Models.Payment>> GetByHealerIdAsync(int healerId)
        {
            return await _paymentRepository.GetByHealerIdAsync(healerId);
        }

        public async Task<Models.Payment> CreateAsync(Models.Payment payment)
        {
            payment.CreatedAt = System.DateTime.UtcNow;
            payment.UpdatedAt = System.DateTime.UtcNow;
            return await _paymentRepository.AddAsync(payment);
        }

        public async Task UpdateAsync(Models.Payment payment)
        {
            payment.UpdatedAt = System.DateTime.UtcNow;
            await _paymentRepository.UpdateAsync(payment);
        }

        public async Task DeleteAsync(int id)
        {
            await _paymentRepository.DeleteAsync(id);
        }
    }

    public class NurturingSessionService : INurturingSessionService
    {
        private readonly INurturingSessionRepository _nurturingSessionRepository;

        public NurturingSessionService(INurturingSessionRepository nurturingSessionRepository)
        {
            _nurturingSessionRepository = nurturingSessionRepository;
        }

        public async Task<Models.NurturingSession> GetByIdAsync(int id)
        {
            return await _nurturingSessionRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Models.NurturingSession>> GetByHealerIdAsync(int healerId)
        {
            return await _nurturingSessionRepository.GetByHealerIdAsync(healerId);
        }

        public async Task<Models.NurturingSession> CreateAsync(Models.NurturingSession session)
        {
            session.CreatedAt = System.DateTime.UtcNow;
            session.UpdatedAt = System.DateTime.UtcNow;
            return await _nurturingSessionRepository.AddAsync(session);
        }

        public async Task UpdateAsync(Models.NurturingSession session)
        {
            session.UpdatedAt = System.DateTime.UtcNow;
            await _nurturingSessionRepository.UpdateAsync(session);
        }

        public async Task DeleteAsync(int id)
        {
            await _nurturingSessionRepository.DeleteAsync(id);
        }
    }
}
