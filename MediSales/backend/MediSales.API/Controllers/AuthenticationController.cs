using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using MediSales.API.Services.Interfaces;
using MediSales.API.DTOs.Authentication;

namespace MediSales.API.Controllers
{
    /// <summary>
    /// Handles user authentication operations.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthenticationController : ControllerBase
    {
        private readonly Services.Interfaces.IAuthenticationService _authService;
        private readonly Services.Interfaces.IAuditLogService _auditLogService;
        private readonly ILogger<AuthenticationController> _logger;

        public AuthenticationController(
            Services.Interfaces.IAuthenticationService authService,
            Services.Interfaces.IAuditLogService auditLogService,
            ILogger<AuthenticationController> logger)
        {
            _authService = authService;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _authService.LoginAsync(loginRequest);

                if (result == null)
                {
                    _logger.LogWarning("Failed login attempt for username: {Username}", loginRequest.Username);
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, result.UserId.ToString()),
                    new Claim(ClaimTypes.Name, result.Username),
                    new Claim(ClaimTypes.Email, result.Email),
                    new Claim(ClaimTypes.Role, result.Role.ToString()),
                    new Claim("FullName", result.FullName)
                };

                var claimsIdentity = new ClaimsIdentity(claims, "Cookies");
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
                    AllowRefresh = true
                };

                await HttpContext.SignInAsync("Cookies", new ClaimsPrincipal(claimsIdentity), authProperties);

                await _auditLogService.LogAsync(
                    "Login", 
                    "User", 
                    result.UserId.ToString(), 
                    result.UserId, 
                    $"User {result.Username} logged in successfully");

                _logger.LogInformation("User {Username} logged in successfully with cookie authentication", loginRequest.Username);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for username: {Username}", loginRequest.Username);
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Logout([FromBody] int userId)
        {
            try
            {
                var result = await _authService.LogoutAsync(userId);

                if (!result)
                {
                    _logger.LogWarning("Failed logout attempt for user ID: {UserId}", userId);
                    return NotFound(new { message = "User not found" });
                }

                await HttpContext.SignOutAsync("Cookies");

                await _auditLogService.LogAsync(
                    "Logout", 
                    "User", 
                    userId.ToString(), 
                    userId, 
                    $"User ID {userId} logged out successfully");

                _logger.LogInformation("User ID {UserId} logged out successfully", userId);
                return Ok(new { message = "Logout successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout for user ID: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterStaffDto registerRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _authService.RegisterAsync(registerRequest);

                if (result == null)
                {
                    _logger.LogWarning("Failed registration attempt for username: {Username}", registerRequest.Username);
                    return BadRequest(new { message = "Username or email already exists" });
                }

                _logger.LogInformation("New user {Username} registered successfully", registerRequest.Username);
                return CreatedAtAction(nameof(Login), new { username = result.Username }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for username: {Username}", registerRequest.Username);
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }
    }
}
