using MediSales.API.Data;
using MediSales.API.Services;
using MediSales.API.Services.Interfaces;
using MediSales.API.Services.Implementations;
using MediSales.API.Services.Background;
using MediSales.API.Repositories.Interfaces;
using MediSales.API.Repositories.Implementations;
using MediSales.API.Hubs;
using MediSales.API.Utilities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Configure Controllers with JSON options for enum string conversion
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Allow enums to be serialized/deserialized as strings (e.g., "Cash" instead of 0)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // Make property names case-insensitive for better API compatibility
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Use camelCase for JSON property names (frontend expects camelCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configure CORS for both API and SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowViteDevServer", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// Add SignalR services with custom user ID provider
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();

// Configure Authentication and Authorization (required for [Authorize] attributes)
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "Cookies";
})
.AddCookie("Cookies", options =>
{
    options.Cookie.Name = "MediSales.Auth";
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    
    // Prevent redirects for API endpoints - return 401 instead
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401; // Return 401 instead of redirect for API
        return Task.CompletedTask;
    };
    
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403; // Return 403 instead of redirect for API
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

// Configure DbContext with MySQL using Pomelo provider
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    );

    // Enable detailed errors and sensitive data logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});

// Register Repositories
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IStockAlertRepository, StockAlertRepository>();
builder.Services.AddScoped<IInventoryMovementRepository, InventoryMovementRepository>();

// Register Services
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IStockAlertService, StockAlertService>();
builder.Services.AddScoped<IReportsService, ReportsService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IInventoryMovementService, InventoryMovementService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<FileUploadService>(); // Profile picture upload service

// Register Background Services
builder.Services.AddHostedService<StockMonitoringBackgroundService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        // Guard: ensure database can be connected to before seeding
        try
        {
            if (context.Database.CanConnect())
            {
                DbSeeder.SeedData(context);
            }
            else
            {
                logger.LogWarning("Database cannot be reached during startup seeding. Skipping seeding.");
            }
        }
        catch (Exception seedingEx)
        {
            // Log seeding errors but do not crash the application
            logger.LogError(seedingEx, "An error occurred while attempting to seed the database. Continuing without seeding.");
        }
    }
    catch (Exception ex)
    {
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var startupLogger = loggerFactory.CreateLogger("Startup");
        startupLogger.LogError(ex, "Failed to create scope or retrieve services during startup seeding.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS
app.UseCors("AllowViteDevServer");

// Serve static files (for profile pictures)
app.UseStaticFiles();

app.UseHttpsRedirection();

// CRITICAL: Must call UseAuthentication BEFORE UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
