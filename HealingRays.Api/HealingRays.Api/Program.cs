using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using HealingRays.Api.Services.Implementations;

namespace HealingRays.Api
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Check if this is a seed command
            if (args.Length > 0 && args[0].Equals("seed", StringComparison.OrdinalIgnoreCase))
            {
                await RunSeeder(args);
                return;
            }

            // Normal web application startup
            CreateHostBuilder(args).Build().Run();
        }

        private static async Task RunSeeder(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            
            using (var scope = host.Services.CreateScope())
            {
                var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
                await seeder.SeedAsync();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
