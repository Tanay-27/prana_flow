using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.SpaServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using HealingRays.Api.Configuration;
using HealingRays.Api.Repositories.Interfaces;
using HealingRays.Api.Repositories.Implementations;
using HealingRays.Api.Services.Interfaces;
using HealingRays.Api.Services.Implementations;

namespace HealingRays.Api
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers()
                .AddNewtonsoftJson();

            // Database Context
            services.AddDbContext<HealingRaysDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection")));

            // JWT Authentication
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["JwtSettings:Secret"])),
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };
                });

            // AutoMapper
            services.AddAutoMapper(typeof(Startup));

            // Fluent Validation - temporarily disabled for .NET Core 3.1 compatibility
            // services.AddFluentValidation(fv =>
            // {
            //     fv.RegisterValidatorsFromAssemblyContaining<Startup>();
            // });

            // Swagger/OpenAPI
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Healing Rays API", Version = "v1" });

                // Add JWT Bearer token support
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // CORS
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            // Register repositories
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IClientRepository, ClientRepository>();
            services.AddScoped<ISessionRepository, SessionRepository>();
            services.AddScoped<IProtocolRepository, ProtocolRepository>();
            services.AddScoped<IPaymentRepository, PaymentRepository>();
            services.AddScoped<INurturingSessionRepository, NurturingSessionRepository>();
            services.AddScoped<IHealingNoteRepository, HealingNoteRepository>();

            // Register services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IClientService, ClientService>();
            services.AddScoped<ISessionService, SessionService>();
            services.AddScoped<IProtocolService, ProtocolService>();
            services.AddScoped<IPaymentService, PaymentService>();
            services.AddScoped<INurturingSessionService, NurturingSessionService>();

            // Register file service
            services.AddScoped<IFileService, LocalFileService>();

            // Register database seeder
            services.AddTransient<DatabaseSeeder>();

            // Add SPA services for serving React frontend
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "wwwroot";
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Healing Rays API v1"));
            }

            app.UseHttpsRedirection();

            // Serve static files (CSS, JS, images)
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseCors("AllowAll");

            app.UseAuthentication();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            // SPA fallback - serve React app for all non-API routes
            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "wwwroot";
                spa.Options.DefaultPageStaticFileOptions = new StaticFileOptions
                {
                    OnPrepareResponse = context =>
                    {
                        // Prevent caching of index.html
                        context.Context.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                        context.Context.Response.Headers.Add("Pragma", "no-cache");
                        context.Context.Response.Headers.Add("Expires", "0");
                    }
                };

                // In development, proxy to Vite dev server (optional)
                if (env.IsDevelopment())
                {
                    // spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
                }
            });
        }
    }
}
