namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Type of reference for inventory movement
    /// </summary>
    public enum ReferenceType
    {
        /// <summary>
        /// Movement from purchase order
        /// </summary>
        PurchaseOrder,

        /// <summary>
        /// Movement from sales transaction
        /// </summary>
        Sale,

        /// <summary>
        /// Manual stock adjustment
        /// </summary>
        Adjustment,

        /// <summary>
        /// Product return
        /// </summary>
        Return,

        /// <summary>
        /// Product expired and removed
        /// </summary>
        Expired
    }
}
