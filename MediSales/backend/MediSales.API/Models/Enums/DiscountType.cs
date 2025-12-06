namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Types of discounts available in the system
    /// </summary>
    public enum DiscountType
    {
        /// <summary>
        /// No discount applied
        /// </summary>
        None,
        
        /// <summary>
        /// Senior Citizen discount - 20% off
        /// </summary>
        SeniorCitizen,
        
        /// <summary>
        /// Person With Disability (PWD) discount - 20% off
        /// </summary>
        PWD
    }
}
