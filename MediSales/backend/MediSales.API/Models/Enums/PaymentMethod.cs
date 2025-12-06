namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Payment methods accepted in the POS system
    /// </summary>
    public enum PaymentMethod
    {
        /// <summary>
        /// Cash payment
        /// </summary>
        Cash,

        /// <summary>
        /// GCash e-wallet payment
        /// </summary>
        GCash,

        /// <summary>
        /// Credit Card payment
        /// </summary>
        CreditCard
    }
}
