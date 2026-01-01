# MediSales POS and Inventory Management System

A complete Point of Sale and Inventory Management System built for pharmaceutical and medical supply businesses. This system handles real-time inventory tracking, sales transactions, and business reporting.

## Features

### Authentication & User Management
- Role-based access control for different user types
- User profiles with customizable pictures
- Staff permission management
- Online status tracking

### Sales & Transactions
- Fast POS interface for processing sales
- Barcode scanner integration
- Complete transaction history
- Transaction void and cancellation
- Receipt printing

### Inventory Management
- Real-time stock tracking
- Movement and audit logs
- Low stock alerts
- Product categories and organization
- Expiry date tracking

### Dashboard & Analytics
- Sales performance metrics
- Revenue and profit tracking
- Product performance reports
- Inventory overview
- Custom date range filtering

### Communication
- Internal messaging between staff
- Real-time notifications via SignalR
- System alerts and warnings

### Reports
- Daily, weekly, monthly, and yearly sales reports
- Inventory status reports
- Transaction logs
- Excel export functionality
- Analytics and insights

## Technology Stack

### Backend
- .NET 9 with C#
- ASP.NET Core Web API
- Entity Framework Core for database access
- MySQL database
- SignalR for real-time features
- JWT authentication

### Frontend
- React 19 with TypeScript
- Vite for development and building
- TailwindCSS for styling
- Axios for API requests
- React Router for navigation
- Recharts for visualizations
- SignalR Client for real-time updates
- React Hot Toast for notifications

## Prerequisites

You'll need these installed before running the application:

- .NET 9 SDK (https://dotnet.microsoft.com/download/dotnet/9.0)
- Node.js v18 or higher (https://nodejs.org/)
- MySQL v8.0 or higher (https://dev.mysql.com/downloads/mysql/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ken-io123/medisales-pos.git
cd medisales-pos
```

### 2. Database Setup

First, create the MySQL database:

```sql
CREATE DATABASE medisales_db;
```

Then configure the database connection:
- Copy `appsettings.example.json` to `appsettings.json`
- Copy `appsettings.example.json` to `appsettings.Development.json`
- Update the connection string with your database credentials:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=medisales_db;user=YOUR_USERNAME;password=YOUR_PASSWORD;AllowUserVariables=True;UseAffectedRows=False"
  }
}
```

### 3. Backend Setup

```bash
# Navigate to the API project
cd MediSales/backend/MediSales.API

# Restore dependencies
dotnet restore

# Apply database migrations
dotnet ef database update

# Run the API (will start on https://localhost:7001)
dotnet run
```

The API will be available at `https://localhost:7001` and `http://localhost:5001`

### 4. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend
cd MediSales/frontend/medisales-frontend

# Install dependencies
npm install

# Start the development server (will start on http://localhost:5173)
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Configuration

Backend configuration files:
- appsettings.json - Production settings
- appsettings.Development.json - Development settings

Frontend configuration:
- vite.config.ts - Vite build configuration
- tailwind.config.js - TailwindCSS styling
- tsconfig.json - TypeScript compiler options

## Running Tests

```bash
# Navigate to the test project
cd MediSales/backend/MediSales.Tests

# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Building for Production

Backend build:
```
cd MediSales/backend/MediSales.API
dotnet publish -c Release -o ./publish
```

Frontend build:

cd MediSales/frontend/medisales-frontend
npm run build
```

## License

This project is licensed under the MIT License.

## Author

ken-io123

## Support

For questions or issues, contact: kenmesana123@gmail.com

---

Note: This system is intended for educational and project purposes. Review all security settings before using in production.
