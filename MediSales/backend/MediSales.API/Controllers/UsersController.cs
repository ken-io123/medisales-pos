using Microsoft.AspNetCore.Mvc;
using MediSales.API.Services.Interfaces;
using MediSales.API.Services;
using MediSales.API.DTOs.Authentication;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace MediSales.API.Controllers
{
    /// <summary>User management endpoints.</summary>
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthenticationService _authService;
        private readonly ILogger<UsersController> _logger;
        private readonly FileUploadService _fileUploadService;

        public UsersController(
            ApplicationDbContext context,
            IAuthenticationService authService,
            ILogger<UsersController> logger,
            FileUploadService fileUploadService)
        {
            _context = context;
            _authService = authService;
            _logger = logger;
            _fileUploadService = fileUploadService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.Email,
                        u.FullName,
                        u.PhoneNumber,
                        u.Role,
                        u.Status,
                        u.ProfilePictureUrl,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching users");
                return StatusCode(500, new { message = "An error occurred while fetching users", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == id)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.Email,
                        u.FullName,
                        u.PhoneNumber,
                        u.Role,
                        u.Status,
                        u.ProfilePictureUrl,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching user", error = ex.Message });
            }
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(LoginResponseDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> CreateUser([FromBody] RegisterStaffDto registerRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _authService.RegisterAsync(registerRequest);

                if (result == null)
                {
                    _logger.LogWarning("Failed to create user: {Username}", registerRequest.Username);
                    return BadRequest(new { message = "Username or email already exists" });
                }

                _logger.LogInformation("New user {Username} created successfully", registerRequest.Username);
                return CreatedAtAction(nameof(GetUserById), new { id = result.UserId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating user: {Username}", registerRequest.Username);
                return StatusCode(500, new { message = "An error occurred while creating user", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto updateRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Update fields if provided
                if (!string.IsNullOrWhiteSpace(updateRequest.Email))
                {
                    // Check if email is already in use by another user
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email == updateRequest.Email && u.UserId != id);

                    if (emailExists)
                    {
                        return BadRequest(new { message = "Email already in use" });
                    }

                    user.Email = updateRequest.Email;
                }

                if (!string.IsNullOrWhiteSpace(updateRequest.FullName))
                {
                    user.FullName = updateRequest.FullName;
                }

                if (!string.IsNullOrWhiteSpace(updateRequest.PhoneNumber))
                {
                    user.PhoneNumber = updateRequest.PhoneNumber;
                }

                if (!string.IsNullOrWhiteSpace(updateRequest.Role))
                {
                    if (Enum.TryParse<UserRole>(updateRequest.Role, true, out var roleEnum))
                    {
                        user.Role = roleEnum;
                    }
                }

                if (!string.IsNullOrWhiteSpace(updateRequest.Status))
                {
                    if (Enum.TryParse<UserStatus>(updateRequest.Status, true, out var statusEnum))
                    {
                        user.Status = statusEnum;
                    }
                }

                // Update password if provided
                if (!string.IsNullOrWhiteSpace(updateRequest.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateRequest.Password);
                }

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} updated successfully", id);

                var updatedUser = new
                {
                    user.UserId,
                    user.Username,
                    user.Email,
                    user.FullName,
                    user.PhoneNumber,
                    user.Role,
                    user.Status,
                    user.CreatedAt,
                    user.UpdatedAt
                };

                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while updating user", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} deleted successfully", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting user", error = ex.Message });
            }
        }

        [HttpPost("{id}/profile-picture")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UploadProfilePicture(int id, [FromForm] IFormFile file)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Delete old profile picture if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureFileName))
                {
                    await _fileUploadService.DeleteProfilePictureAsync(user.ProfilePictureFileName);
                }

                var (success, fileName, url, error) = await _fileUploadService.UploadProfilePictureAsync(file, id);

                if (!success)
                {
                    return BadRequest(new { message = error });
                }

                user.ProfilePictureFileName = fileName;
                user.ProfilePictureUrl = url;
                user.ProfilePictureUploadedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Profile picture uploaded successfully", url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile picture for user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while uploading profile picture", error = ex.Message });
            }
        }

        [HttpDelete("{id}/profile-picture")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteProfilePicture(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                if (!string.IsNullOrEmpty(user.ProfilePictureFileName))
                {
                    await _fileUploadService.DeleteProfilePictureAsync(user.ProfilePictureFileName);
                    
                    user.ProfilePictureFileName = null;
                    user.ProfilePictureUrl = null;
                    user.ProfilePictureUploadedAt = null;
                    user.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting profile picture for user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting profile picture", error = ex.Message });
            }
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> SearchUsers([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return await GetAllUsers();
                }

                var users = await _context.Users
                    .Where(u => u.Username.Contains(searchTerm) || u.FullName.Contains(searchTerm))
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.Email,
                        u.FullName,
                        u.PhoneNumber,
                        u.Role,
                        u.Status,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching users");
                return StatusCode(500, new { message = "An error occurred while searching users", error = ex.Message });
            }
        }
    }

    public class UpdateUserDto
    {
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public string? Password { get; set; }
    }
}
