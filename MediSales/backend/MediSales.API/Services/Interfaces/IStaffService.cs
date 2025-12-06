using MediSales.API.DTOs.Staff;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for staff management.</summary>
    public interface IStaffService
    {
        Task<IEnumerable<StaffDto>> GetAllStaffAsync();
        Task<StaffDto?> GetStaffByIdAsync(int id);
        Task<StaffDto> CreateStaffAsync(CreateStaffDto createStaffDto, int? currentUserId = null);
        Task<StaffDto?> UpdateStaffAsync(int id, UpdateStaffDto updateStaffDto, int? currentUserId = null);
        Task<bool> DeleteStaffAsync(int id, int? currentUserId = null);
        Task<IEnumerable<StaffLoginHistoryDto>> GetStaffLoginHistoryAsync(int staffId);
        Task<StaffDto?> UpdateStaffStatusAsync(int staffId, string status);
        Task<(IEnumerable<StaffDto> Items, int TotalCount)> GetStaffPaginatedAsync(
            int page, 
            int pageSize, 
            string? searchTerm = null, 
            string? role = null, 
            string? status = null);
    }
}
