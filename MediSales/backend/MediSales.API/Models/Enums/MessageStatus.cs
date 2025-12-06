namespace MediSales.API.Models.Enums
{
    /// <summary>
    /// Status of messages between staff and administrators
    /// </summary>
    public enum MessageStatus
    {
        /// <summary>
        /// Message has not been read yet
        /// </summary>
        Unread,
        
        /// <summary>
        /// Message has been read
        /// </summary>
        Read,
        
        /// <summary>
        /// Message has been archived
        /// </summary>
        Archived
    }
}
