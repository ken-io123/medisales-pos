namespace MediSales.API.Services
{
    public class FileUploadService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadService> _logger;
        private readonly string _uploadsFolder;

        public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger)
        {
            _environment = environment;
            _logger = logger;
            
            var webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            _uploadsFolder = Path.Combine(webRootPath, "uploads", "profile-pictures");

            // Ensure uploads directory exists
            if (!Directory.Exists(_uploadsFolder))
            {
                Directory.CreateDirectory(_uploadsFolder);
            }
        }

        public async Task<(bool success, string? fileName, string? url, string? error)> UploadProfilePictureAsync(
            IFormFile file, int userId)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return (false, null, null, "No file uploaded");
                }

                // Check file size (max 5MB)
                if (file.Length > 5 * 1024 * 1024)
                {
                    return (false, null, null, "File size exceeds 5MB limit");
                }

                // Check file extension
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return (false, null, null, "Invalid file type. Only JPG, PNG, and GIF are allowed");
                }

                // Generate unique filename
                var fileName = $"user_{userId}_{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(_uploadsFolder, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Generate URL
                var url = $"/uploads/profile-pictures/{fileName}";

                _logger.LogInformation($"Profile picture uploaded successfully for user {userId}: {fileName}");
                return (true, fileName, url, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading profile picture for user {userId}");
                return (false, null, null, $"Upload failed: {ex.Message}");
            }
        }

        public async Task<bool> DeleteProfilePictureAsync(string fileName)
        {
            try
            {
                if (string.IsNullOrEmpty(fileName))
                {
                    return false;
                }

                var filePath = Path.Combine(_uploadsFolder, fileName);
                if (File.Exists(filePath))
                {
                    await Task.Run(() => File.Delete(filePath));
                    _logger.LogInformation($"Profile picture deleted: {fileName}");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting profile picture: {fileName}");
                return false;
            }
        }
    }
}
