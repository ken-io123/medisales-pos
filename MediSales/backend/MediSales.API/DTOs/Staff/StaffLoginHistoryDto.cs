namespace MediSales.API.DTOs.Staff
{
    /// <summary>
    /// Staff login history data.
    /// </summary>
    public class StaffLoginHistoryDto
    {
        public int LoginId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public DateTime LoginDate { get; set; }
        public DateTime? LogoutDate { get; set; }
        public string? IpAddress { get; set; }
        public string? Notes { get; set; }

        public int? SessionDurationMinutes
        {
            get
            {
                if (LogoutDate.HasValue)
                {
                    return (int)(LogoutDate.Value - LoginDate).TotalMinutes;
                }
                return null;
            }
        }
    }
}
