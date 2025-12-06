using Microsoft.EntityFrameworkCore;
using MediSales.API.Models.Entities;
using MediSales.API.Models.Enums;

namespace MediSales.API.Data
{
    /// <summary>Database context for MediSales POS system.</summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Product> Products { get; set; }

        public DbSet<Transaction> Transactions { get; set; }

        public DbSet<TransactionItem> TransactionItems { get; set; }

        public DbSet<Message> Messages { get; set; }

        public DbSet<StockAlert> StockAlerts { get; set; }

        public DbSet<InventoryMovement> InventoryMovements { get; set; }

        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =====================================================================
            // USER CONFIGURATION
            // =====================================================================
            // Configures User entity with authentication and authorization features
            modelBuilder.Entity<User>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.UserId);
                
                // Unique indexes for authentication
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                
                // Performance index for archive filtering
                entity.HasIndex(e => e.IsArchived);
                
                // Enum conversions to string for readability in database
                entity.Property(e => e.Status)
                    .HasDefaultValue(UserStatus.Offline)
                    .HasConversion<string>();
                
                entity.Property(e => e.Role)
                    .HasConversion<string>();

                // One-to-Many: User has many Transactions
                // Restrict delete to prevent accidental transaction history loss
                entity.HasMany(e => e.Transactions)
                    .WithOne(t => t.User)
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // One-to-Many: User sends many Messages
                // Restrict delete to maintain message audit trail
                entity.HasMany(e => e.SentMessages)
                    .WithOne(m => m.FromUser)
                    .HasForeignKey(m => m.FromUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // One-to-Many: User receives many Messages
                // Restrict delete to maintain message audit trail
                entity.HasMany(e => e.ReceivedMessages)
                    .WithOne(m => m.ToUser)
                    .HasForeignKey(m => m.ToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // One-to-Many: User resolves many StockAlerts
                // Set null when user is deleted (alerts remain for history)
                entity.HasMany(e => e.ResolvedAlerts)
                    .WithOne(a => a.ResolvedByUser)
                    .HasForeignKey(a => a.ResolvedBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            
            // Configures Product entity for pharmaceutical inventory management
            modelBuilder.Entity<Product>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.ProductId);
                
                // Indexes for fast product lookup
                entity.HasIndex(e => e.ProductCode).IsUnique();
                entity.HasIndex(e => e.ProductName);
                
                // Performance index for archive filtering
                entity.HasIndex(e => e.IsArchived);

                // Decimal precision for currency values
                entity.Property(e => e.UnitPrice)
                    .HasPrecision(10, 2);

                // Default stock quantity
                entity.Property(e => e.StockQuantity)
                    .HasDefaultValue(0);

                // One-to-Many: Product appears in many TransactionItems
                // Restrict delete to preserve transaction history
                entity.HasMany(e => e.TransactionItems)
                    .WithOne(ti => ti.Product)
                    .HasForeignKey(ti => ti.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                // One-to-Many: Product has many StockAlerts
                // Cascade delete when product is removed
                entity.HasMany(e => e.StockAlerts)
                    .WithOne(sa => sa.Product)
                    .HasForeignKey(sa => sa.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            
            // Configures Transaction entity for POS sales records
            modelBuilder.Entity<Transaction>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.TransactionId);
                
                // Indexes for transaction lookup and reporting
                entity.HasIndex(e => e.TransactionCode).IsUnique();
                entity.HasIndex(e => e.TransactionDate);
                
                // Performance indexes for filtering
                entity.HasIndex(e => e.IsVoided);
                
                // Composite index for transaction filtering by date and void status
                entity.HasIndex(e => new { e.TransactionDate, e.IsVoided });

                // Decimal precision for all monetary values
                entity.Property(e => e.TotalAmount)
                    .HasPrecision(10, 2);

                entity.Property(e => e.SubtotalAmount)
                    .HasPrecision(10, 2);

                entity.Property(e => e.DiscountAmount)
                    .HasPrecision(10, 2)
                    .HasDefaultValue(0);

                entity.Property(e => e.DiscountPercentage)
                    .HasPrecision(5, 2)
                    .HasDefaultValue(0);

                entity.Property(e => e.AmountPaid)
                    .HasPrecision(10, 2);

                entity.Property(e => e.ChangeAmount)
                    .HasPrecision(10, 2)
                    .HasDefaultValue(0);

                // Enum conversions with default values
                entity.Property(e => e.DiscountType)
                    .HasDefaultValue(DiscountType.None)
                    .HasConversion<string>();

                entity.Property(e => e.PaymentMethod)
                    .HasConversion<string>();

                // One-to-Many: Transaction has many TransactionItems
                // Cascade delete to remove all items when transaction is deleted
                entity.HasMany(e => e.TransactionItems)
                    .WithOne(ti => ti.Transaction)
                    .HasForeignKey(ti => ti.TransactionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            
            // Configures TransactionItem entity for individual line items in sales
            modelBuilder.Entity<TransactionItem>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.TransactionItemId);

                // Decimal precision for monetary calculations
                entity.Property(e => e.UnitPrice)
                    .HasPrecision(10, 2);

                entity.Property(e => e.Subtotal)
                    .HasPrecision(10, 2);
            });

           
            // Configures Message entity for staff-admin communication
            modelBuilder.Entity<Message>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.MessageId);
                
                // Index for chronological message queries
                entity.HasIndex(e => e.CreatedAt);
                
                // Performance index for archive filtering
                entity.HasIndex(e => e.IsArchived);
                
                // Composite index for user-specific message queries with date
                entity.HasIndex(e => new { e.ToUserId, e.CreatedAt });

                // Enum conversion and default values
                entity.Property(e => e.MessageStatus)
                    .HasDefaultValue(MessageStatus.Unread)
                    .HasConversion<string>();

                entity.Property(e => e.IsReplied)
                    .HasDefaultValue(false);
            });

            
            // Configures StockAlert entity for inventory and expiration notifications
            modelBuilder.Entity<StockAlert>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.StockAlertId);
                
                // Index for chronological alert queries
                entity.HasIndex(e => e.AlertDate);

                // Enum conversion to string
                entity.Property(e => e.AlertType)
                    .HasConversion<string>();

                // Default value for alert resolution status
                entity.Property(e => e.IsResolved)
                    .HasDefaultValue(false);
            });

            // =====================================================================
            // INVENTORY MOVEMENT CONFIGURATION
            // =====================================================================
            // Configures InventoryMovement entity for tracking stock changes
            modelBuilder.Entity<InventoryMovement>(entity =>
            {
                // Primary key
                entity.HasKey(e => e.MovementId);
                
                // Indexes for efficient querying
                entity.HasIndex(e => e.ProductId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.MovementType);
                
                // Composite index for product movement history queries
                entity.HasIndex(e => new { e.ProductId, e.CreatedAt });

                // Enum conversions to string
                entity.Property(e => e.MovementType)
                    .HasConversion<string>();

                entity.Property(e => e.ReferenceType)
                    .HasConversion<string>();

                // One-to-Many: Product has many InventoryMovements
                // Restrict delete to preserve movement history
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                // One-to-Many: User creates many InventoryMovements
                // Restrict delete to maintain audit trail
                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
