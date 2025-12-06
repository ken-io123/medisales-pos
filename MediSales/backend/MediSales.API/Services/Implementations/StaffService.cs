using MediSales.API.Data;
using MediSales.API.DTOs.Staff;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using MediSales.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Service for managing staff members
    /// </summary>
    public class StaffService : IStaffService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StaffService> _logger;
        private readonly IAuditLogService _auditLogService;

        public StaffService(ApplicationDbContext context, ILogger<StaffService> logger, IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<StaffDto>> GetAllStaffAsync()
        {
            try
            {
                var staff = await _context.Users
                    .OrderBy(u => u.FullName)
                    .Select(u => new StaffDto
                    {
                        UserId = u.UserId,
                        Username = u.Username,
                        FullName = u.FullName,
                        Email = u.Email,
                        PhoneNumber = u.PhoneNumber,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        DateCreated = u.CreatedAt,
                        LastLogin = u.LastLoginDate
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} staff members", staff.Count);
                return staff;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all staff members");
                throw;
            }
        }

        public async Task<StaffDto?> GetStaffByIdAsync(int id)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == id)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Staff member with ID {StaffId} not found", id);
                    return null;
                }

                return new StaffDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString(),
                    DateCreated = user.CreatedAt,
                    LastLogin = user.LastLoginDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff member with ID {StaffId}", id);
                throw;
            }
        }

        public async Task<StaffDto> CreateStaffAsync(CreateStaffDto createStaffDto, int? currentUserId = null)
        {
            try
            {
                // Check if username already exists
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Username == createStaffDto.Username);

                if (existingUser)
                {
                    throw new InvalidOperationException($"Username '{createStaffDto.Username}' already exists");
                }

                // Check if email already exists
                var existingEmail = await _context.Users
                    .AnyAsync(u => u.Email == createStaffDto.Email);

                if (existingEmail)
                {
                    throw new InvalidOperationException($"Email '{createStaffDto.Email}' already exists");
                }

                // Validate role
                if (!Enum.TryParse<UserRole>(createStaffDto.Role, true, out var role))
                {
                    throw new ArgumentException($"Invalid role: {createStaffDto.Role}");
                }

                // Hash password using BCrypt
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createStaffDto.Password);

                // Create new user
                var newUser = new User
                {
                    Username = createStaffDto.Username,
                    PasswordHash = hashedPassword,
                    FullName = createStaffDto.FullName,
                    Email = createStaffDto.Email,
                    PhoneNumber = createStaffDto.PhoneNumber,
                    Role = role,
                    Status = UserStatus.Offline,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                await _auditLogService.LogAsync("Create", "Staff", newUser.UserId.ToString(), currentUserId, $"Created staff member: {newUser.Username}");

                _logger.LogInformation("Created new staff member: {Username} (ID: {UserId})", 
                    newUser.Username, newUser.UserId);

                return new StaffDto
                {
                    UserId = newUser.UserId,
                    Username = newUser.Username,
                    FullName = newUser.FullName,
                    Email = newUser.Email,
                    PhoneNumber = newUser.PhoneNumber,
                    Role = newUser.Role.ToString(),
                    Status = newUser.Status.ToString(),
                    DateCreated = newUser.CreatedAt,
                    LastLogin = newUser.LastLoginDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating staff member: {Username}", createStaffDto.Username);
                throw;
            }
        }

        public async Task<StaffDto?> UpdateStaffAsync(int id, UpdateStaffDto updateStaffDto, int? currentUserId = null)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == id)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Staff member with ID {StaffId} not found for update", id);
                    return null;
                }

                // Update fields if provided
                if (!string.IsNullOrWhiteSpace(updateStaffDto.FullName))
                {
                    user.FullName = updateStaffDto.FullName;
                }

                if (!string.IsNullOrWhiteSpace(updateStaffDto.Email))
                {
                    // Check if email is already used by another user
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email == updateStaffDto.Email && u.UserId != id);

                    if (emailExists)
                    {
                        throw new InvalidOperationException($"Email '{updateStaffDto.Email}' is already in use");
                    }

                    user.Email = updateStaffDto.Email;
                }

                if (updateStaffDto.PhoneNumber != null)
                {
                    user.PhoneNumber = updateStaffDto.PhoneNumber;
                }

                if (!string.IsNullOrWhiteSpace(updateStaffDto.Role))
                {
                    if (Enum.TryParse<UserRole>(updateStaffDto.Role, true, out var role))
                    {
                        user.Role = role;
                    }
                    else
                    {
                        throw new ArgumentException($"Invalid role: {updateStaffDto.Role}");
                    }
                }

                // Update password if provided
                if (!string.IsNullOrWhiteSpace(updateStaffDto.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateStaffDto.Password);
                    _logger.LogInformation("Password updated for staff member ID {StaffId}", id);
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await _auditLogService.LogAsync("Update", "Staff", user.UserId.ToString(), currentUserId, $"Updated staff member: {user.Username}");

                _logger.LogInformation("Updated staff member ID {StaffId}", id);

                return new StaffDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString(),
                    DateCreated = user.CreatedAt,
                    LastLogin = user.LastLoginDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating staff member ID {StaffId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteStaffAsync(int id, int? currentUserId = null)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == id)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Staff member with ID {StaffId} not found for deletion", id);
                    return false;
                }

                // Remove the user from database
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                await _auditLogService.LogAsync("Delete", "Staff", id.ToString(), currentUserId, $"Deleted staff member: {user.Username}");

                _logger.LogInformation("Deleted staff member ID {StaffId} ({Username})", id, user.Username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting staff member ID {StaffId}", id);
                throw;
            }
        }

        public async Task<IEnumerable<StaffLoginHistoryDto>> GetStaffLoginHistoryAsync(int staffId)
        {
            try
            {
                // TODO: Implement LoginHistory table in database schema
                // For now, return empty list
                _logger.LogWarning("LoginHistory feature not yet implemented. Returning empty list for staff ID {StaffId}", staffId);
                
                return await Task.FromResult(new List<StaffLoginHistoryDto>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving login history for staff ID {StaffId}", staffId);
                throw;
            }
        }

        public async Task<StaffDto?> UpdateStaffStatusAsync(int staffId, string status)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == staffId)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Staff member with ID {StaffId} not found for status update", staffId);
                    return null;
                }

                // Validate and parse status to UserStatus enum
                if (!Enum.TryParse<UserStatus>(status, true, out var userStatus))
                {
                    throw new ArgumentException($"Invalid status: {status}. Valid values are: Online, Offline");
                }

                user.Status = userStatus;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated status to '{Status}' for staff member ID {StaffId}", status, staffId);

                return new StaffDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString(),
                    DateCreated = user.CreatedAt,
                    LastLogin = user.LastLoginDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for staff member ID {StaffId}", staffId);
                throw;
            }
        }

        public async Task<(IEnumerable<StaffDto> Items, int TotalCount)> GetStaffPaginatedAsync(
            int page, 
            int pageSize, 
            string? searchTerm = null, 
            string? role = null, 
            string? status = null)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    searchTerm = searchTerm.ToLower();
                    query = query.Where(u => 
                        u.Username.ToLower().Contains(searchTerm) || 
                        u.FullName.ToLower().Contains(searchTerm) || 
                        u.Email.ToLower().Contains(searchTerm));
                }

                if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var roleEnum))
                {
                    query = query.Where(u => u.Role == roleEnum);
                }

                if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<UserStatus>(status, true, out var statusEnum))
                {
                    query = query.Where(u => u.Status == statusEnum);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination and sorting
                var staff = await query
                    .OrderBy(u => u.FullName)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new StaffDto
                    {
                        UserId = u.UserId,
                        Username = u.Username,
                        FullName = u.FullName,
                        Email = u.Email,
                        PhoneNumber = u.PhoneNumber,
                        Role = u.Role.ToString(),
                        Status = u.Status.ToString(),
                        DateCreated = u.CreatedAt,
                        LastLogin = u.LastLoginDate,
                        ProfilePictureUrl = u.ProfilePictureUrl,
                        IsOnlineNow = u.IsOnlineNow
                    })
                    .ToListAsync();

                return (staff, totalCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paginated staff members");
                throw;
            }
        }
    }
}
