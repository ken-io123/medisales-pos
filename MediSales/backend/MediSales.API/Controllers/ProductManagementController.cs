using Microsoft.AspNetCore.Mvc;
using MediSales.API.Services.Interfaces;
using MediSales.API.DTOs.Products;

namespace MediSales.API.Controllers
{
    /// <summary>
    /// Product management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/products")]
    public class ProductManagementController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IInventoryMovementService _inventoryMovementService;
        private readonly ILogger<ProductManagementController> _logger;

        public ProductManagementController(
            IProductService productService,
            IInventoryMovementService inventoryMovementService,
            ILogger<ProductManagementController> logger)
        {
            _productService = productService;
            _inventoryMovementService = inventoryMovementService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllProducts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? category = null,
            [FromQuery] int? minStock = null,
            [FromQuery] int? maxStock = null,
            [FromQuery] int? expiringInDays = null)
        {
            try
            {
                var filter = new ProductSearchFilterDto
                {
                    SearchTerm = searchTerm,
                    Category = category,
                    MinStock = minStock,
                    MaxStock = maxStock,
                    ExpiringInDays = expiringInDays
                };

                var (products, totalCount) = await _productService.GetProductsPaginatedAsync(page, pageSize, filter);
                
                var response = new
                {
                    Data = products,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products");
                return StatusCode(500, new { message = "An error occurred while retrieving products" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductById(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product with ID {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
            }
        }

        [HttpGet("code/{code}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductByCode(string code)
        {
            try
            {
                var product = await _productService.GetProductByCodeAsync(code);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with code '{code}' not found" });
                }

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product with code {ProductCode}", code);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
            }
        }

        [HttpGet("low-stock")]
        [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLowStockProducts([FromQuery] int threshold = 10)
        {
            try
            {
                var products = await _productService.GetLowStockProductsAsync(threshold);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving low stock products");
                return StatusCode(500, new { message = "An error occurred while retrieving low stock products" });
            }
        }

        [HttpGet("expiring")]
        [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetExpiringProducts([FromQuery] int days = 30, [FromQuery] bool includeArchived = false)
        {
            try
            {
                var products = await _productService.GetExpiringProductsAsync(days, includeArchived);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expiring products");
                return StatusCode(500, new { message = "An error occurred while retrieving expiring products" });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var product = await _productService.CreateProductAsync(createDto);
                return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, product);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to create product: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { message = "An error occurred while creating the product" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var product = await _productService.UpdateProductAsync(id, updateDto);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                return Ok(product);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to update product {ProductId}: {Message}", id, ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product" });
            }
        }

        [HttpPost("{id}/archive")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ArchiveProduct(int id)
        {
            try
            {
                // Use JWT if available, otherwise default to admin user (ID=1)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                int userId;
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    userId = jwtUserId;
                }
                else
                {
                    // Fallback to default admin for backward compatibility
                    userId = 1;
                    _logger.LogWarning("No JWT found, using default admin user ID for archive operation");
                }

                var result = await _productService.ArchiveProductAsync(id, userId);

                if (!result)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                _logger.LogInformation("Product {ProductId} archived by user {UserId}", id, userId);
                return Ok(new { message = "Product archived successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while archiving the product" });
            }
        }

        [HttpPost("{id}/restore")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RestoreProduct(int id)
        {
            try
            {
                var result = await _productService.RestoreProductAsync(id);

                if (!result)
                {
                    return NotFound(new { message = $"Product with ID {id} not found or not archived" });
                }

                _logger.LogInformation("Product {ProductId} restored", id);
                return Ok(new { message = "Product restored successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while restoring the product" });
            }
        }

        [HttpGet("archived")]
        [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetArchivedProducts()
        {
            try
            {
                var products = await _productService.GetArchivedProductsAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving archived products");
                return StatusCode(500, new { message = "An error occurred while retrieving archived products" });
            }
        }

        [HttpPatch("{id}/stock")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int quantity)
        {
            try
            {
                var result = await _productService.UpdateStockAsync(id, quantity);

                if (!result)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                _logger.LogInformation("Stock updated for product {ProductId} to {Quantity}", id, quantity);
                return Ok(new { message = "Stock updated successfully", productId = id, newQuantity = quantity });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to update stock for product {ProductId}: {Message}", id, ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock for product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while updating stock" });
            }
        }

        [HttpGet("expiring/stats")]
        [ProducesResponseType(typeof(ExpiringProductsStatsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetExpiringProductsStats()
        {
            try
            {
                var stats = await _productService.GetExpiringProductsStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expiring products statistics");
                return StatusCode(500, new { message = "An error occurred while retrieving expiring products statistics" });
            }
        }

        [HttpGet("alerts/check")]
        [ProducesResponseType(typeof(AlertCheckResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CheckStockAlerts()
        {
            try
            {
                var result = await _productService.CheckAndGenerateAlertsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking stock alerts");
                return StatusCode(500, new { message = "An error occurred while checking stock alerts" });
            }
        }

        [HttpGet("alerts/stock")]
        [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetStockAlerts([FromQuery] bool includeResolved = false)
        {
            try
            {
                var alerts = await _productService.GetStockAlertsAsync(includeResolved);
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stock alerts");
                return StatusCode(500, new { message = "An error occurred while retrieving stock alerts" });
            }
        }

        [HttpPost("bulk-archive")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> BulkArchiveProducts([FromBody] int[] productIds)
        {
            try
            {
                if (productIds == null || productIds.Length == 0)
                {
                    return BadRequest(new { message = "Product IDs are required" });
                }

                // Use JWT if available, otherwise default to admin user (ID=1)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                int userId;
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int jwtUserId))
                {
                    userId = jwtUserId;
                }
                else
                {
                    // Fallback to default admin for backward compatibility
                    userId = 1;
                    _logger.LogWarning("No JWT found, using default admin user ID for bulk archive operation");
                }

                int archivedCount = 0;
                var errors = new List<string>();

                foreach (var id in productIds)
                {
                    try
                    {
                        var result = await _productService.ArchiveProductAsync(id, userId);
                        if (result)
                        {
                            archivedCount++;
                        }
                        else
                        {
                            errors.Add($"Product {id} not found");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to archive product {ProductId}", id);
                        errors.Add($"Product {id}: {ex.Message}");
                    }
                }

                _logger.LogInformation("Bulk archive completed: {Archived} of {Total} products archived", archivedCount, productIds.Length);
                
                return Ok(new
                {
                    message = $"Successfully archived {archivedCount} of {productIds.Length} products",
                    archivedCount,
                    totalRequested = productIds.Length,
                    errors = errors.Count > 0 ? errors : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk archive operation");
                return StatusCode(500, new { message = "An error occurred during bulk archive operation" });
            }
        }

        [HttpGet("export/csv")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ExportProductsToCSV(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? category = null)
        {
            try
            {
                var filter = new ProductSearchFilterDto
                {
                    SearchTerm = searchTerm,
                    Category = category
                };

                var products = await _productService.GetAllProductsAsync(filter);
                
                var csv = new System.Text.StringBuilder();
                csv.AppendLine("Product Code,Product Name,Category,Unit Price,Stock Quantity,Supplier,Expiry Date,Created At,Updated At");
                
                foreach (var product in products)
                {
                    var expiryDate = product.ExpiryDate != DateTime.MinValue ? product.ExpiryDate.ToString("yyyy-MM-dd") : "";
                    var createdAt = product.CreatedAt != DateTime.MinValue ? product.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss") : "";
                    var updatedAt = product.UpdatedAt != DateTime.MinValue ? product.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss") : "";
                    
                    csv.AppendLine($"\"{product.ProductCode}\",\"{product.ProductName}\",\"{product.Category ?? ""}\",{product.UnitPrice},{product.StockQuantity},\"{product.SupplierName ?? ""}\",\"{expiryDate}\",\"{createdAt}\",\"{updatedAt}\"");
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
                var fileName = $"products_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                
                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting products to CSV");
                return StatusCode(500, new { message = "An error occurred while exporting products" });
            }
        }

        [HttpGet("{id}/arrival-date")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductArrivalDate(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                var arrivalDate = await _inventoryMovementService.GetFirstArrivalDateAsync(id);
                
                return Ok(new { 
                    productId = id,
                    productName = product.ProductName,
                    arrivalDate = arrivalDate,
                    hasArrivalDate = arrivalDate.HasValue
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving arrival date for product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product arrival date" });
            }
        }
    }
}
