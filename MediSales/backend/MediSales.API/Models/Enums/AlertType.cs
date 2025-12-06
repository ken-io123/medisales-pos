namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Types of stock and expiration alerts
    /// </summary>
    public enum AlertType
    {
        /// <summary>
        /// Stock level is below 20 units
        /// </summary>
        LowStock,
        
        /// <summary>
        /// Product is out of stock (0 units)
        /// </summary>
        OutOfStock,
        
        /// <summary>
        /// Product is expiring within 7 days - Critical alert
        /// </summary>
        ExpiringIn7Days,
        
        /// <summary>
        /// Product is expiring within 30 days - Warning alert
        /// </summary>
        ExpiringIn30Days,
        
        /// <summary>
        /// Product is expiring within 60 days - Notice alert
        /// </summary>
        ExpiringIn60Days,
        
        /// <summary>
        /// Product has already expired
        /// </summary>
        Expired
    }
}
