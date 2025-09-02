# IMA Material Management System

A comprehensive SAP Fiori OpenUI5 application for managing material requests and approvals with role-based access control.

## Features

- **Multi-User Authentication**: Three distinct personas with different access levels
- **Role-Based Dashboards**: Customized interfaces for each user type
- **Material Management**: Complete lifecycle from request to approval
- **Advanced Search & Filtering**: Powerful search capabilities across all materials
- **Data Export**: CSV export functionality for analysis
- **Responsive Design**: Works on desktop, tablet, and phone
- **Built with OpenUI5**: Version 1.139.0
- **SAP Fiori Design**: Follows SAP Fiori design principles

## User Personas

### 1. MaterialSearchUser
- **Username**: `materialsearch`
- **Password**: `search123`
- **Capabilities**:
  - Search for existing materials by name, description, or category
  - View material details in a comprehensive table
  - Create new material requests if materials are not found
  - "Create New Material Request" button is disabled when materials are found

### 2. MaterialCreateUser
- **Username**: `materialcreate`
- **Password**: `create123`
- **Capabilities**:
  - View all material creation requests
  - Filter requests by status (Requested, Email Sent to IMA)
  - Send email to IMA (changes status to `emailSentToIMA`)
  - Close requests (enables only after email is sent, changes status to `approved`)
  - Summary cards showing request counts and statuses

### 3. AnalystUser
- **Username**: `analyst`
- **Password**: `analyst123`
- **Capabilities**:
  - View all materials with all statuses (approved, requested, emailSentToIMA)
  - Advanced filtering by status and category
  - Search functionality across materials
  - Export data to CSV format
  - Read-only access to material details and specifications
  - Summary dashboard with material counts

## Project Structure

```
webapp/
├── controller/
│   ├── App.controller.js          # Main app container controller
│   ├── Login.controller.js        # Authentication controller
│   └── Main.controller.js         # Main dashboard controller with all persona functions
├── view/
│   ├── App.view.xml               # Main app container view
│   ├── Login.view.xml             # Login page view
│   ├── Main.view.xml              # Main dashboard view with dynamic fragments
│   └── fragments/
│       ├── MaterialSearch.fragment.xml      # MaterialSearchUser interface
│       ├── MaterialRequests.fragment.xml    # MaterialCreateUser interface
│       └── AnalystDashboard.fragment.xml    # AnalystUser interface
├── model/
│   ├── config/
│   │   └── users.json             # User credentials and personas
│   ├── data/
│   │   └── materials.json         # Material data with statuses
│   └── UserModel.js               # Model factory for all data models
├── Component.js                   # Application component with routing and models
├── manifest.json                  # Application configuration and routing
└── index.html                     # Entry point with custom styling
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm run deploy` - Deploy the application

## Technologies Used

- **OpenUI5**: 1.139.0
- **UI Libraries**: sap.m, sap.ui.core, sap.ui.layout
- **Theme**: sap_fiori_3
- **Architecture**: MVC pattern with routing
- **Data Storage**: JSON files (easily replaceable with database)

## How It Works

### Authentication Flow

1. **Default Route**: Application starts at the login page (`/`)
2. **Login**: Use credentials for any of the three personas
3. **Navigation**: After successful login, you're redirected to the main dashboard (`/main`)
4. **Dynamic Interface**: Dashboard automatically shows the appropriate interface based on your persona
5. **Logout**: Click the logout button to return to the login page

### Material Status Workflow

1. **Requested**: Initial status when a material request is created
2. **Email Sent to IMA**: Status after MaterialCreateUser sends email to IMA
3. **Approved**: Final status after MaterialCreateUser closes the request

### Key Features

- **Material Search**: Powerful search across all material properties
- **Request Management**: Complete workflow for material approval
- **Data Filtering**: Advanced filtering and sorting capabilities
- **Export Functionality**: CSV export for data analysis
- **Real-time Updates**: Dynamic status changes and model updates
- **Responsive UI**: Modern, intuitive interface design

## Routing Configuration

The application uses OpenUI5 routing with the following routes:

- **`/` (empty)**: Login page (default)
- **`/main`**: Main application dashboard

Routing is configured in `manifest.json` and initialized in `Component.js`.

## Data Models

- **UserModel**: Manages authentication state and user information
- **MaterialsModel**: Contains all material data
- **RequestsModel**: Contains pending and in-progress material requests
- **DeviceModel**: Provides device-specific information

## Customization

### Styling
- Custom CSS classes for modern UI elements
- Gradient backgrounds and glass-morphism effects
- Responsive design for all device types
- SAP Fiori 3 theme integration

### Authentication
- Configurable user credentials in `users.json`
- Easy to extend with real authentication systems
- Role-based access control
- Session management

### Data Management
- JSON-based data storage (easily replaceable)
- Real-time model updates
- Data validation and error handling
- Export capabilities

## Future Enhancements

- Database integration (MySQL, PostgreSQL, SAP HANA)
- Real authentication system integration
- User registration and management
- Advanced reporting and analytics
- Email integration for notifications
- Workflow automation
- Mobile app development
- API endpoints for external systems

## Troubleshooting

### Common Issues

1. **Login Fails**: Ensure you're using the correct credentials from `users.json`
2. **Data Not Loading**: Check that the JSON files are accessible and properly formatted
3. **Routing Issues**: Verify that all fragment files exist and are properly referenced

### Development Tips

- Use browser developer tools to debug UI5 applications
- Check the console for JavaScript errors
- Verify model bindings in the UI5 Inspector
- Test on different devices for responsive design validation

This is a production-ready example that demonstrates advanced OpenUI5 development patterns, role-based access control, and comprehensive material management workflows.
