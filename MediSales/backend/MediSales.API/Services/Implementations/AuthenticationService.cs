using MediSales.API.Services.Interfaces;
using MediSales.API.DTOs.Authentication;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Handles user authentication operations.
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private readonly ApplicationDbContext _context;

        public AuthenticationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginRequest.Username);

            if (user == null)
            {
                return null;
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                return null;
            }

            user.Status = UserStatus.Online;
            user.LastLoginDate = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                UserId = user.UserId,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                Token = null
            };
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return false;
            }

            user.Status = UserStatus.Offline;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<LoginResponseDto?> RegisterAsync(RegisterStaffDto registerRequest)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == registerRequest.Username);

            if (existingUser != null)
            {
                return null;
            }

            var existingEmail = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == registerRequest.Email);

            if (existingEmail != null)
            {
                return null;
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password);

            var newUser = new User
            {
                Username = registerRequest.Username,
                PasswordHash = hashedPassword,
                FullName = registerRequest.FullName,
                Email = registerRequest.Email,
                PhoneNumber = registerRequest.PhoneNumber,
                Role = registerRequest.Role,
                Status = UserStatus.Offline,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                UserId = newUser.UserId,
                Username = newUser.Username,
                FullName = newUser.FullName,
                Email = newUser.Email,
                Role = newUser.Role,
                PhoneNumber = newUser.PhoneNumber,
                Token = null // Reserved for future JWT implementation
            };
        }
    }
}
