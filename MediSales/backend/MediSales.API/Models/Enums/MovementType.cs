namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Type of inventory movement
    /// </summary>
    public enum MovementType
    {
        /// <summary>
        /// Stock added to inventory
        /// </summary>
        Inbound,

        /// <summary>
        /// Stock removed or sold from inventory
        /// </summary>
        Outbound
    }
}
