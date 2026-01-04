using System.Collections.Generic;
using System.Threading.Tasks;
using HealingRays.Api.Repositories.Interfaces;
using HealingRays.Api.Services.Interfaces;

namespace HealingRays.Api.Services.Implementations
{
    public class ClientService : IClientService
    {
        private readonly IClientRepository _clientRepository;
        private readonly IHealingNoteRepository _healingNoteRepository;

        public ClientService(IClientRepository clientRepository, IHealingNoteRepository healingNoteRepository)
        {
            _clientRepository = clientRepository;
            _healingNoteRepository = healingNoteRepository;
        }

        public async Task<Models.Client> GetByIdAsync(int id)
        {
            return await _clientRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Models.Client>> GetByHealerIdAsync(int healerId)
        {
            return await _clientRepository.GetByHealerIdAsync(healerId);
        }

        public async Task<Models.Client> CreateAsync(Models.Client client)
        {
            client.CreatedAt = System.DateTime.UtcNow;
            client.UpdatedAt = System.DateTime.UtcNow;
            return await _clientRepository.AddAsync(client);
        }

        public async Task UpdateAsync(Models.Client client)
        {
            client.UpdatedAt = System.DateTime.UtcNow;
            await _clientRepository.UpdateAsync(client);
        }

        public async Task DeleteAsync(int id)
        {
            await _clientRepository.DeleteAsync(id);
        }

        public async Task AddNoteAsync(int clientId, string noteText)
        {
            var note = new Models.HealingNote
            {
                ClientId = clientId,
                Text = noteText,
                Timestamp = System.DateTime.UtcNow
            };

            await _healingNoteRepository.AddAsync(note);
        }
    }
}
