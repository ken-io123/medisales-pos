using MediSales.API.Services.Interfaces;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.DTOs.Products;
using MediSales.API.Models.Entities;
using MediSales.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MediSales.API.Services.Implementations
{
    /// <summary>
    /// Product business logic implementation.
    /// </summary>
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ProductService(
            IProductRepository productRepository,
            IHubContext<NotificationHub> hubContext)
        {
            _productRepository = productRepository;
            _hubContext = hubContext;
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync(ProductSearchFilterDto? filter = null)
        {
            IEnumerable<Product> products;

            if (filter != null)
            {
                products = await _productRepository.GetAllProductsAsync();
                products = products.Where(p => !p.IsArchived);

                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    products = await _productRepository.SearchProductsAsync(filter.SearchTerm);
                    products = products.Where(p => !p.IsArchived);
                }

                if (!string.IsNullOrWhiteSpace(filter.Category))
                {
                    products = products.Where(p => p.Category.Equals(filter.Category, StringComparison.OrdinalIgnoreCase));
                }

                if (filter.MinStock.HasValue)
                {
                    products = products.Where(p => p.StockQuantity >= filter.MinStock.Value);
                }

                if (filter.MaxStock.HasValue)
                {
                    products = products.Where(p => p.StockQuantity <= filter.MaxStock.Value);
                }

                if (filter.MinPrice.HasValue)
                {
                    products = products.Where(p => p.UnitPrice >= filter.MinPrice.Value);
                }

                if (filter.MaxPrice.HasValue)
                {
                    products = products.Where(p => p.UnitPrice <= filter.MaxPrice.Value);
                }

                if (filter.ExpiringInDays.HasValue)
                {
                    var targetDate = DateTime.UtcNow.AddDays(filter.ExpiringInDays.Value);
                    products = products.Where(p => p.ExpiryDate <= targetDate && p.ExpiryDate >= DateTime.UtcNow);
                }
            }
            else
            {
                products = await _productRepository.GetAllProductsAsync();
                products = products.Where(p => !p.IsArchived);
            }

            return products.Select(MapToDto);
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetProductByIdAsync(id);
            return product == null ? null : MapToDto(product);
        }

        public async Task<ProductDto?> GetProductByCodeAsync(string code)
        {
            var product = await _productRepository.GetProductByCodeAsync(code);
            return product == null ? null : MapToDto(product);
        }

        public async Task<IEnumerable<ProductDto>> GetLowStockProductsAsync(int threshold = 10)
        {
            var products = await _productRepository.GetLowStockProductsAsync(threshold);
            var activeProducts = products.Where(p => !p.IsArchived);
            return activeProducts.Select(MapToDto);
        }

        public async Task<IEnumerable<ProductDto>> GetExpiringProductsAsync(int days = 30, bool includeArchived = false)
        {
            var products = await _productRepository.GetExpiringProductsAsync(days);
            var filteredProducts = includeArchived ? products : products.Where(p => !p.IsArchived);
            return filteredProducts.Select(MapToDto);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto)
        {
            if (await _productRepository.ProductCodeExistsAsync(createDto.ProductCode))
            {
                throw new InvalidOperationException($"Product code '{createDto.ProductCode}' already exists.");
            }

            if (createDto.ManufacturingDate.HasValue && createDto.ExpiryDate <= createDto.ManufacturingDate.Value)
            {
                throw new InvalidOperationException("Expiry date must be after manufacturing date.");
            }

            var product = new Product
            {
                ProductCode = createDto.ProductCode,
                ProductName = createDto.ProductName,
                Category = createDto.Category,
                Description = createDto.Description,
                UnitPrice = createDto.UnitPrice,
                StockQuantity = createDto.StockQuantity,
                SupplierName = createDto.SupplierName,
                ManufacturingDate = createDto.ManufacturingDate,
                ExpiryDate = createDto.ExpiryDate
            };

            var createdProduct = await _productRepository.AddProductAsync(product);
            
            // Broadcast product creation to all clients (especially Staff POS)
            await _hubContext.Clients.All.SendAsync("ProductCreated", new
            {
                productId = createdProduct.ProductId,
                productName = createdProduct.ProductName,
                productCode = createdProduct.ProductCode,
                category = createdProduct.Category,
                stockQuantity = createdProduct.StockQuantity,
                unitPrice = createdProduct.UnitPrice
            });
            
            return MapToDto(createdProduct);
        }

        public async Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateDto)
        {
            var existingProduct = await _productRepository.GetProductByIdAsync(id);

            if (existingProduct == null)
            {
                return null;
            }

            // Check if product code is being changed and if it already exists
            if (existingProduct.ProductCode != updateDto.ProductCode)
            {
                if (await _productRepository.ProductCodeExistsAsync(updateDto.ProductCode, id))
                {
                    throw new InvalidOperationException($"Product code '{updateDto.ProductCode}' already exists.");
                }
            }

            // Validate dates
            if (updateDto.ManufacturingDate.HasValue && updateDto.ExpiryDate <= updateDto.ManufacturingDate.Value)
            {
                throw new InvalidOperationException("Expiry date must be after manufacturing date.");
            }

            // Update product properties
            existingProduct.ProductCode = updateDto.ProductCode;
            existingProduct.ProductName = updateDto.ProductName;
            existingProduct.Category = updateDto.Category;
            existingProduct.Description = updateDto.Description;
            existingProduct.UnitPrice = updateDto.UnitPrice;
            existingProduct.StockQuantity = updateDto.StockQuantity;
            existingProduct.SupplierName = updateDto.SupplierName;
            existingProduct.ManufacturingDate = updateDto.ManufacturingDate;
            existingProduct.ExpiryDate = updateDto.ExpiryDate;

            var updatedProduct = await _productRepository.UpdateProductAsync(existingProduct);
            
            // Broadcast product update to all clients (especially Staff POS)
            await _hubContext.Clients.All.SendAsync("ProductUpdated", new
            {
                productId = updatedProduct.ProductId,
                productName = updatedProduct.ProductName,
                productCode = updatedProduct.ProductCode,
                category = updatedProduct.Category,
                stockQuantity = updatedProduct.StockQuantity,
                unitPrice = updatedProduct.UnitPrice
            });
            
            return MapToDto(updatedProduct);
        }

        public async Task<bool> ArchiveProductAsync(int id, int userId)
        {
            var product = await _productRepository.GetProductByIdAsync(id);

            if (product == null)
            {
                return false;
            }

            product.IsArchived = true;
            product.ArchivedAt = DateTime.UtcNow;
            product.ArchivedBy = userId;

            await _productRepository.UpdateProductAsync(product);
            
            // Broadcast product archival to all clients (especially Staff POS)
            await _hubContext.Clients.All.SendAsync("ProductArchived", new
            {
                productId = product.ProductId,
                productName = product.ProductName,
                productCode = product.ProductCode
            });
            
            return true;
        }

        public async Task<bool> RestoreProductAsync(int id)
        {
            var product = await _productRepository.GetProductByIdAsync(id);

            if (product == null || !product.IsArchived)
            {
                return false;
            }

            product.IsArchived = false;
            product.ArchivedAt = null;
            product.ArchivedBy = null;

            await _productRepository.UpdateProductAsync(product);
            return true;
        }

        public async Task<IEnumerable<ProductDto>> GetArchivedProductsAsync()
        {
            var allProducts = await _productRepository.GetAllProductsAsync();
            var archivedProducts = allProducts.Where(p => p.IsArchived);
            return archivedProducts.Select(MapToDto);
        }

        public async Task<bool> UpdateStockAsync(int productId, int quantity)
        {
            if (quantity < 0)
            {
                throw new InvalidOperationException("Stock quantity cannot be negative.");
            }

            var result = await _productRepository.UpdateStockAsync(productId, quantity);

            // Check if stock is low and send alert
            if (result && quantity < 20)
            {
                var product = await _productRepository.GetProductByIdAsync(productId);
                if (product != null)
                {
                    string alertType = quantity < 10 ? "Critical" : "Low";
                    await _hubContext.Clients.Group("Admins").SendAsync("ReceiveStockAlert",
                        product.ProductName,
                        quantity,
                        alertType);
                }
            }

            return result;
        }

        public async Task<ExpiringProductsStatsDto> GetExpiringProductsStatsAsync()
        {
            var allProducts = await _productRepository.GetAllProductsAsync();
            var activeProducts = allProducts.Where(p => !p.IsArchived);
            var now = DateTime.UtcNow;

            var expiringProducts = activeProducts
                .Where(p => p.ExpiryDate > now)
                .ToList();

            var stats = new ExpiringProductsStatsDto
            {
                ExpiringIn7Days = expiringProducts.Count(p => p.ExpiryDate <= now.AddDays(7)),
                ExpiringIn30Days = expiringProducts.Count(p => p.ExpiryDate <= now.AddDays(30)),
                ExpiringIn60Days = expiringProducts.Count(p => p.ExpiryDate <= now.AddDays(60)),
                TotalExpiring = expiringProducts.Count(p => p.ExpiryDate <= now.AddDays(90)),
                ByCategory = expiringProducts
                    .Where(p => p.ExpiryDate <= now.AddDays(90))
                    .GroupBy(p => p.Category)
                    .ToDictionary(g => g.Key, g => g.Count()),
                TotalValueAtRisk = expiringProducts
                    .Where(p => p.ExpiryDate <= now.AddDays(30))
                    .Sum(p => p.UnitPrice * p.StockQuantity)
            };

            return stats;
        }

        public async Task<AlertCheckResultDto> CheckAndGenerateAlertsAsync()
        {
            var allProducts = await _productRepository.GetAllProductsAsync();
            var activeProducts = allProducts.Where(p => !p.IsArchived).ToList();
            var now = DateTime.UtcNow;

            var lowStockProducts = activeProducts.Where(p => p.StockQuantity < 10).ToList();
            var expiringProducts = activeProducts.Where(p => p.ExpiryDate <= now.AddDays(30) && p.ExpiryDate > now).ToList();
            var outOfStockProducts = activeProducts.Where(p => p.StockQuantity == 0).ToList();

            return new AlertCheckResultDto
            {
                LowStockAlertsGenerated = lowStockProducts.Count,
                ExpiringProductsFound = expiringProducts.Count,
                OutOfStockProducts = outOfStockProducts.Count,
                CheckedAt = DateTime.UtcNow
            };
        }

        public async Task<IEnumerable<object>> GetStockAlertsAsync(bool includeResolved)
        {
            var allProducts = await _productRepository.GetAllProductsAsync();
            var activeProducts = allProducts.Where(p => !p.IsArchived);
            var now = DateTime.UtcNow;

            var alerts = new List<object>();

            // Low stock alerts
            var lowStockProducts = activeProducts.Where(p => p.StockQuantity < 10 && p.StockQuantity > 0);
            alerts.AddRange(lowStockProducts.Select(p => new
            {
                AlertId = p.ProductId, // Use ProductId as AlertId for frontend compatibility
                Type = "LowStock",
                ProductId = p.ProductId,
                ProductCode = p.ProductCode,
                ProductName = p.ProductName,
                CurrentStock = p.StockQuantity,
                Severity = p.StockQuantity < 5 ? "High" : "Medium",
                CreatedAt = DateTime.UtcNow
            }));

            // Out of stock alerts
            var outOfStockProducts = activeProducts.Where(p => p.StockQuantity == 0);
            alerts.AddRange(outOfStockProducts.Select(p => new
            {
                AlertId = p.ProductId, // Use ProductId as AlertId for frontend compatibility
                Type = "OutOfStock",
                ProductId = p.ProductId,
                ProductCode = p.ProductCode,
                ProductName = p.ProductName,
                CurrentStock = 0,
                Severity = "Critical",
                CreatedAt = DateTime.UtcNow
            }));

            // Expiring soon alerts
            var expiringProducts = activeProducts.Where(p => p.ExpiryDate <= now.AddDays(30) && p.ExpiryDate > now);
            alerts.AddRange(expiringProducts.Select(p => new
            {
                AlertId = p.ProductId, // Use ProductId as AlertId for frontend compatibility
                Type = "ExpiringSoon",
                ProductId = p.ProductId,
                ProductCode = p.ProductCode,
                ProductName = p.ProductName,
                ExpiryDate = p.ExpiryDate,
                DaysUntilExpiry = (p.ExpiryDate - now).Days,
                Severity = (p.ExpiryDate - now).Days <= 7 ? "High" : "Medium",
                CreatedAt = DateTime.UtcNow
            }));

            return alerts.OrderByDescending(a => ((dynamic)a).Severity);
        }

        private static ProductDto MapToDto(Product product)
        {
            return new ProductDto
            {
                ProductId = product.ProductId,
                ProductCode = product.ProductCode,
                ProductName = product.ProductName,
                Category = product.Category,
                Description = product.Description,
                UnitPrice = product.UnitPrice,
                StockQuantity = product.StockQuantity,
                SupplierName = product.SupplierName,
                ManufacturingDate = product.ManufacturingDate,
                ExpiryDate = product.ExpiryDate,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                IsArchived = product.IsArchived,
                ArchivedAt = product.ArchivedAt,
                ArchivedBy = product.ArchivedBy
            };
        }

        public async Task<(IEnumerable<ProductDto> Items, int TotalCount)> GetProductsPaginatedAsync(int page, int pageSize, ProductSearchFilterDto? filter = null)
        {
            IEnumerable<Product> products;

            // Start with all active (non-archived) products unless specified otherwise
            // Note: Ideally, repository should handle pagination to avoid loading all into memory.
            // For now, we'll filter in memory as per current architecture, but this should be optimized later.
            products = await _productRepository.GetAllProductsAsync();
            
            // Default to active only unless filter specifies otherwise (if we add that option later)
            products = products.Where(p => !p.IsArchived);

            if (filter != null)
            {
                // Apply search term filter
                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    // Re-fetch if search term is present to use repository search optimization if available
                    // But since we already fetched all, we can just filter in memory for now
                    // Or better, use the repository search if it's more efficient
                    var searchResults = await _productRepository.SearchProductsAsync(filter.SearchTerm);
                    // Intersect with non-archived
                    products = searchResults.Where(p => !p.IsArchived);
                }

                // Apply category filter
                if (!string.IsNullOrWhiteSpace(filter.Category))
                {
                    products = products.Where(p => p.Category.Equals(filter.Category, StringComparison.OrdinalIgnoreCase));
                }

                // Apply stock filters
                if (filter.MinStock.HasValue)
                {
                    products = products.Where(p => p.StockQuantity >= filter.MinStock.Value);
                }

                if (filter.MaxStock.HasValue)
                {
                    products = products.Where(p => p.StockQuantity <= filter.MaxStock.Value);
                }

                // Apply price filters
                if (filter.MinPrice.HasValue)
                {
                    products = products.Where(p => p.UnitPrice >= filter.MinPrice.Value);
                }

                if (filter.MaxPrice.HasValue)
                {
                    products = products.Where(p => p.UnitPrice <= filter.MaxPrice.Value);
                }

                // Apply expiring filter
                if (filter.ExpiringInDays.HasValue)
                {
                    var targetDate = DateTime.UtcNow.AddDays(filter.ExpiringInDays.Value);
                    products = products.Where(p => p.ExpiryDate <= targetDate && p.ExpiryDate >= DateTime.UtcNow);
                }
            }

            var totalCount = products.Count();
            
            var paginatedProducts = products
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToDto);

            return (paginatedProducts, totalCount);
        }
    }
}
