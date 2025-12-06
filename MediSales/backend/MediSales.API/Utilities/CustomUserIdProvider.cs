using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace MediSales.API.Utilities
{
    /// <summary>
    /// Custom user ID provider for SignalR that uses the NameIdentifier claim.
    /// This allows SignalR to identify users by their user ID from authentication cookies.
    /// </summary>
    public class CustomUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            // Use the NameIdentifier claim (user ID) as the SignalR user identifier
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
