using AutoMapper;
using HealingRays.Api.DTOs.Auth;

namespace HealingRays.Api.Configuration
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Auth mappings
            CreateMap<Models.User, UserDto>();

            // Add other mappings as needed
            // Example:
            // CreateMap<Models.Client, ClientDto>();
            // CreateMap<ClientCreateDto, Models.Client>();
        }
    }
}
