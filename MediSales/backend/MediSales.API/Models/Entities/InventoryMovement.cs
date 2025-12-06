using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using MediSales.API.Models.Enums;

namespace MediSales.API.Models.Entities
{
    /// <summary>
    /// Tracks stock changes for inventory auditing.
    /// </summary>
    [Index(nameof(ProductId))]
    [Index(nameof(CreatedAt))]
    [Index(nameof(MovementType))]
    public class InventoryMovement
    {
        [Key]
        public int MovementId { get; set; }

        [Required(ErrorMessage = "Product ID is required")]
        public int ProductId { get; set; }

        [Required]
        public MovementType MovementType { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        public int Quantity { get; set; }

        [Required]
        public int PreviousQuantity { get; set; }

        [Required]
        public int NewQuantity { get; set; }

        [Required]
        public ReferenceType ReferenceType { get; set; }

        [MaxLength(50)]
        public string? ReferenceId { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }

        [Required]
        public int CreatedBy { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(ProductId))]
        public virtual Product Product { get; set; } = null!;

        [ForeignKey(nameof(CreatedBy))]
        public virtual User CreatedByUser { get; set; } = null!;
    }
}
