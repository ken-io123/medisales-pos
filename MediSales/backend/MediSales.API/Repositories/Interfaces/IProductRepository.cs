using MediSales.API.Models.Entities;

namespace MediSales.API.Repositories.Interfaces
{
    /// <summary>Repository for product data access.</summary>
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAllProductsAsync();
        Task<Product?> GetProductByIdAsync(int id);
        Task<Product?> GetProductByCodeAsync(string code);
        Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
        Task<IEnumerable<Product>> FilterByCategoryAsync(string category);
        Task<IEnumerable<Product>> GetLowStockProductsAsync(int threshold);
        Task<IEnumerable<Product>> GetExpiringProductsAsync(int days);
        Task<Product> AddProductAsync(Product product);
        Task<Product> UpdateProductAsync(Product product);
        Task<bool> DeleteProductAsync(int id);
        Task<bool> UpdateStockAsync(int productId, int quantity);
        Task<bool> ProductCodeExistsAsync(string code, int? excludeProductId = null);
    }
}
