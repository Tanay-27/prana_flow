using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace HealingRays.Api.Services.Implementations
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<byte[]> GetFileAsync(string filePath);
        Task DeleteFileAsync(string filePath);
    }

    public class LocalFileService : IFileService
    {
        private readonly string _uploadPath;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions;

        public LocalFileService(IConfiguration configuration)
        {
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            _maxFileSize = configuration.GetValue<long>("FileUpload:MaxSizeBytes", 10485760); // 10MB default
            _allowedExtensions = configuration.GetSection("FileUpload:AllowedExtensions").Get<string[]>() ?? new[] { ".jpg", ".jpeg", ".png", ".pdf" };

            // Ensure upload directory exists
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty or null");
            }

            if (file.Length > _maxFileSize)
            {
                throw new ArgumentException($"File size exceeds maximum allowed size of {_maxFileSize} bytes");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!Array.Exists(_allowedExtensions, ext => ext == extension))
            {
                throw new ArgumentException($"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        public async Task<byte[]> GetFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_uploadPath, filePath);

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException("File not found", filePath);
            }

            return await File.ReadAllBytesAsync(fullPath);
        }

        public Task DeleteFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_uploadPath, filePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            return Task.CompletedTask;
        }
    }
}
