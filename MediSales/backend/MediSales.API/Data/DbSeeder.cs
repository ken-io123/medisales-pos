using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;
using BCrypt.Net;

namespace MediSales.API.Data
{
    public class DbSeeder
    {
        public static void SeedData(ApplicationDbContext context)
        {
            // Ensure database is created
            context.Database.EnsureCreated();

            // Check if data already exists
            if (context.Users.Any())
            {
                return; // Database has been seeded
            }

            // Seed Users
            var users = new List<User>
            {
                new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    FullName = "System Administrator",
                    Email = "admin@medisales.com",
                    PhoneNumber = "09123456789",
                    Role = UserRole.Administrator,
                    Status = UserStatus.Offline,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    Username = "staff1",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                    FullName = "John Dela Cruz",
                    Email = "staff1@medisales.com",
                    PhoneNumber = "09234567890",
                    Role = UserRole.Staff,
                    Status = UserStatus.Offline,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    Username = "staff2",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                    FullName = "Maria Santos",
                    Email = "staff2@medisales.com",
                    PhoneNumber = "09345678901",
                    Role = UserRole.Staff,
                    Status = UserStatus.Offline,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();

            // Seed Products
            var products = new List<Product>
            {
                // Pain Relief
                new Product
                {
                    ProductCode = "MED-001",
                    ProductName = "Biogesic 500mg",
                    Category = "Pain Relief",
                    UnitPrice = 7.50m,
                    StockQuantity = 150,
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(18),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-6),
                    Description = "Paracetamol 500mg for fever and pain relief",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-002",
                    ProductName = "Paracetamol 500mg",
                    Category = "Pain Relief",
                    UnitPrice = 5.00m,
                    StockQuantity = 200,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(12),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-12),
                    Description = "Generic paracetamol for fever and pain",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-003",
                    ProductName = "Ibuprofen 200mg",
                    Category = "Pain Relief",
                    UnitPrice = 8.00m,
                    StockQuantity = 100,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(24),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-6),
                    Description = "Anti-inflammatory and pain reliever",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-004",
                    ProductName = "Mefenamic Acid 500mg",
                    Category = "Pain Relief",
                    UnitPrice = 10.00m,
                    StockQuantity = 80,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(15),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-9),
                    Description = "For menstrual pain and headache",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // Cold/Flu Medicine
                new Product
                {
                    ProductCode = "MED-005",
                    ProductName = "Bioflu",
                    Category = "Cold/Flu Medicine",
                    UnitPrice = 12.00m,
                    StockQuantity = 120,
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(20),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-4),
                    Description = "For fever, body pain, and colds",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-006",
                    ProductName = "Neozep Forte",
                    Category = "Cold/Flu Medicine",
                    UnitPrice = 8.50m,
                    StockQuantity = 90,
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddDays(30), // Expiring soon for testing
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-18),
                    Description = "Decongestant for colds",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-007",
                    ProductName = "Decolgen",
                    Category = "Cold/Flu Medicine",
                    UnitPrice = 9.00m,
                    StockQuantity = 110,
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(16),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-8),
                    Description = "Relief from colds and flu symptoms",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // Antibiotics
                new Product
                {
                    ProductCode = "MED-008",
                    ProductName = "Amoxicillin 500mg",
                    Category = "Antibiotics",
                    UnitPrice = 15.00m,
                    StockQuantity = 60,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(22),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-2),
                    Description = "Antibiotic for bacterial infections",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-009",
                    ProductName = "Cefalexin 500mg",
                    Category = "Antibiotics",
                    UnitPrice = 18.00m,
                    StockQuantity = 50,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(14),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-10),
                    Description = "Cephalosporin antibiotic",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // Antacids
                new Product
                {
                    ProductCode = "MED-010",
                    ProductName = "Kremil-S",
                    Category = "Antacids",
                    UnitPrice = 6.50m,
                    StockQuantity = 8, // Low stock for testing
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(10),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-14),
                    Description = "Relief from heartburn and acidity",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-011",
                    ProductName = "Omeprazole 20mg",
                    Category = "Antacids",
                    UnitPrice = 12.00m,
                    StockQuantity = 70,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(19),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-5),
                    Description = "Proton pump inhibitor for acid reflux",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // Vitamins
                new Product
                {
                    ProductCode = "VIT-001",
                    ProductName = "Vitamin C 500mg",
                    Category = "Vitamins",
                    UnitPrice = 10.00m,
                    StockQuantity = 140,
                    SupplierName = "Pascual Lab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(25),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-1),
                    Description = "Ascorbic acid for immune support",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "VIT-002",
                    ProductName = "Enervon",
                    Category = "Vitamins",
                    UnitPrice = 15.00m,
                    StockQuantity = 100,
                    SupplierName = "Unilab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(21),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-3),
                    Description = "Multivitamins with minerals",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "VIT-003",
                    ProductName = "Centrum",
                    Category = "Vitamins",
                    UnitPrice = 20.00m,
                    StockQuantity = 75,
                    SupplierName = "Pfizer",
                    ExpiryDate = DateTime.UtcNow.AddMonths(23),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-1),
                    Description = "Complete multivitamin supplement",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "VIT-004",
                    ProductName = "Vitamin B-Complex",
                    Category = "Vitamins",
                    UnitPrice = 8.00m,
                    StockQuantity = 5, // Low stock for testing
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddDays(50), // Expiring soon for testing
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-20),
                    Description = "B vitamins for energy",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // Additional items
                new Product
                {
                    ProductCode = "MED-012",
                    ProductName = "Lagundi Tablet",
                    Category = "Herbal Medicine",
                    UnitPrice = 7.00m,
                    StockQuantity = 95,
                    SupplierName = "Pascual Lab",
                    ExpiryDate = DateTime.UtcNow.AddMonths(17),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-7),
                    Description = "Herbal cough remedy",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-013",
                    ProductName = "Cetirizine 10mg",
                    Category = "Antihistamine",
                    UnitPrice = 9.50m,
                    StockQuantity = 130,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(13),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-11),
                    Description = "For allergy relief",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-014",
                    ProductName = "Loperamide 2mg",
                    Category = "Anti-diarrheal",
                    UnitPrice = 6.00m,
                    StockQuantity = 85,
                    SupplierName = "Generic Pharma",
                    ExpiryDate = DateTime.UtcNow.AddMonths(11),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-13),
                    Description = "For acute diarrhea",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-015",
                    ProductName = "Salbutamol Inhaler",
                    Category = "Respiratory",
                    UnitPrice = 45.00m,
                    StockQuantity = 30,
                    SupplierName = "GlaxoSmithKline",
                    ExpiryDate = DateTime.UtcNow.AddMonths(26),
                    ManufacturingDate = DateTime.UtcNow,
                    Description = "Bronchodilator for asthma",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    ProductCode = "MED-016",
                    ProductName = "Aspirin 80mg",
                    Category = "Pain Relief",
                    UnitPrice = 5.50m,
                    StockQuantity = 0, // Out of stock for testing
                    SupplierName = "Bayer",
                    ExpiryDate = DateTime.UtcNow.AddMonths(15),
                    ManufacturingDate = DateTime.UtcNow.AddMonths(-9),
                    Description = "Low-dose aspirin",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Products.AddRange(products);
            context.SaveChanges();

            Console.WriteLine("Database seeded successfully!");
        }
    }
}

