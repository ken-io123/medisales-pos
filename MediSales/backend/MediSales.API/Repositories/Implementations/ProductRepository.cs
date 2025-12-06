using MediSales.API.Repositories.Interfaces;
using MediSales.API.Data;
using MediSales.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace MediSales.API.Repositories.Implementations
{
    /// <summary>Repository for product data access.</summary>
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Product>> GetAllProductsAsync()
        {
            return await _context.Products
                .OrderBy(p => p.ProductName)
                .ToListAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _context.Products.FindAsync(id);
        }

        public async Task<Product?> GetProductByCodeAsync(string code)
        {
            return await _context.Products
                .FirstOrDefaultAsync(p => p.ProductCode == code);
        }

        public async Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm)
        {
            var lowerSearchTerm = searchTerm.ToLower();

            return await _context.Products
                .Where(p => p.ProductName.ToLower().Contains(lowerSearchTerm) ||
                           p.ProductCode.ToLower().Contains(lowerSearchTerm))
                .OrderBy(p => p.ProductName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> FilterByCategoryAsync(string category)
        {
            return await _context.Products
                .Where(p => p.Category.ToLower() == category.ToLower())
                .OrderBy(p => p.ProductName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync(int threshold)
        {
            return await _context.Products
                .Where(p => p.StockQuantity <= threshold)
                .OrderBy(p => p.StockQuantity)
                .ThenBy(p => p.ProductName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetExpiringProductsAsync(int days)
        {
            var targetDate = DateTime.UtcNow.AddDays(days);

            return await _context.Products
                .Where(p => p.ExpiryDate <= targetDate && p.ExpiryDate >= DateTime.UtcNow)
                .OrderBy(p => p.ExpiryDate)
                .ToListAsync();
        }

        public async Task<Product> AddProductAsync(Product product)
        {
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return product;
        }

        public async Task<Product> UpdateProductAsync(Product product)
        {
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return product;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return false;
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return false;
            }

            product.StockQuantity = quantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ProductCodeExistsAsync(string code, int? excludeProductId = null)
        {
            if (excludeProductId.HasValue)
            {
                return await _context.Products
                    .AnyAsync(p => p.ProductCode == code && p.ProductId != excludeProductId.Value);
            }

            return await _context.Products
                .AnyAsync(p => p.ProductCode == code);
        }
    }
}
