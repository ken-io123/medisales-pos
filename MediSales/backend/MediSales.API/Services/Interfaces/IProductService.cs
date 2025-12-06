using MediSales.API.DTOs.Products;

namespace MediSales.API.Services.Interfaces
{
    /// <summary>Service for product business logic operations.</summary>
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync(ProductSearchFilterDto? filter = null);
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto?> GetProductByCodeAsync(string code);
        Task<IEnumerable<ProductDto>> GetLowStockProductsAsync(int threshold = 10);
        Task<IEnumerable<ProductDto>> GetExpiringProductsAsync(int days = 30, bool includeArchived = false);
        Task<ProductDto> CreateProductAsync(CreateProductDto createDto);
        Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateDto);
        Task<bool> ArchiveProductAsync(int id, int userId);
        Task<bool> RestoreProductAsync(int id);
        Task<IEnumerable<ProductDto>> GetArchivedProductsAsync();
        Task<bool> UpdateStockAsync(int productId, int quantity);
        Task<ExpiringProductsStatsDto> GetExpiringProductsStatsAsync();
        Task<AlertCheckResultDto> CheckAndGenerateAlertsAsync();
        Task<IEnumerable<object>> GetStockAlertsAsync(bool includeResolved);
        Task<(IEnumerable<ProductDto> Items, int TotalCount)> GetProductsPaginatedAsync(int page, int pageSize, ProductSearchFilterDto? filter = null);
    }
}
