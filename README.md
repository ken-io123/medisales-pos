# 🏥 MediSales POS and Inventory Management System

A comprehensive Point of Sale (POS) and Inventory Management System designed specifically for pharmaceutical and medical supply businesses. Built with .NET 9 and React 19, this system provides real-time inventory tracking, sales management, and business analytics.

## ✨ Features

### 🔐 Authentication & User Management
- Secure login system with role-based access control
- User profile management with profile pictures
- Staff management with different permission levels
- Real-time online status tracking

### 💼 Sales & Transactions
- Intuitive POS interface for quick transactions
- Barcode scanning support
- Transaction history and tracking
- Void/cancel transaction capabilities
- Receipt generation

### 📦 Inventory Management
- Real-time inventory tracking
- Stock movement monitoring
- Low stock alerts and notifications
- Product categorization
- Batch/expiry date management
- Automated reorder notifications

### 📊 Dashboard & Analytics
- Real-time sales dashboard
- Revenue and profit analytics
- Top-selling products reports
- Inventory status overview
- Performance metrics
- Customizable date range filters

### 💬 Real-time Communication
- Built-in messaging system
- Real-time notifications using SignalR
- Staff-to-staff communication
- System alerts and warnings

### 📄 Reports
- Sales reports (daily, weekly, monthly, yearly)
- Inventory reports
- Transaction history
- Export to Excel functionality
- Comprehensive analytics

## 🛠️ Technology Stack

### Backend
- **.NET 9** - Modern C# web API
- **ASP.NET Core** - Web framework
- **Entity Framework Core** - ORM
- **MySQL** - Database
- **SignalR** - Real-time communication
- **JWT** - Authentication

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation
- **Recharts** - Data visualization
- **SignalR Client** - Real-time updates
- **React Hot Toast** - Notifications

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://dev.mysql.com/downloads/mysql/) (v8.0 or higher)
- [Git](https://git-scm.com/downloads)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/medisales-pos.git
cd medisales-pos
```

### 2. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE medisales_db;
```

2. Configure your database connection in the backend:
   - Copy `appsettings.example.json` to `appsettings.json`
   - Copy `appsettings.example.json` to `appsettings.Development.json`
   - Update the connection string with your MySQL credentials:

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

## 🔑 Default Login Credentials

After seeding the database, you can use these default credentials:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Cashier Account:**
- Username: `cashier1`
- Password: `cashier123`

⚠️ **Important:** Change these default passwords after your first login!

## 📁 Project Structure

```
MediSales POS and Inventory Management System/
├── MediSales/
│   ├── backend/
│   │   ├── MediSales.API/          # Main API project
│   │   │   ├── Controllers/        # API endpoints
│   │   │   ├── Models/             # Data models
│   │   │   ├── DTOs/               # Data transfer objects
│   │   │   ├── Services/           # Business logic
│   │   │   ├── Repositories/       # Data access layer
│   │   │   ├── Hubs/               # SignalR hubs
│   │   │   ├── Data/               # Database context
│   │   │   └── Utilities/          # Helper classes
│   │   └── MediSales.Tests/        # Unit tests
│   └── frontend/
│       └── medisales-frontend/     # React application
│           ├── src/
│           │   ├── components/     # React components
│           │   ├── pages/          # Page components
│           │   ├── services/       # API services
│           │   ├── contexts/       # React contexts
│           │   └── utils/          # Utility functions
│           └── public/             # Static assets
└── MediSales POS and Inventory Management System.sln
```

## 🔧 Configuration

### Backend Configuration

Key configuration files:
- `appsettings.json` - Production settings
- `appsettings.Development.json` - Development settings

### Frontend Configuration

- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration

## 🧪 Running Tests

```bash
# Navigate to the test project
cd MediSales/backend/MediSales.Tests

# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 📦 Building for Production

### Backend
```bash
cd MediSales/backend/MediSales.API
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
cd MediSales/frontend/medisales-frontend
npm run build
```

The production build will be in the `dist` folder.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check connection string credentials
- Ensure database exists
- Check firewall settings

### Port Already in Use
- Backend: Change ports in `Properties/launchSettings.json`
- Frontend: Vite will automatically try the next available port

### Migration Issues
```bash
# Reset database
dotnet ef database drop
dotnet ef database update
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Authors

ken-io123

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world pharmacy management needs
- Special thanks to all contributors

## 📞 Support

For support, email kenmesana123@gmail.com 

---

**Note:** This system is designed for educational and project use. Make sure to review security settings before deploying to production.
