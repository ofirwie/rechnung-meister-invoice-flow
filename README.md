# Rechnung Meister Invoice Flow

A professional invoice management system built with React, TypeScript, and Supabase. Fully operational with complete client, service, and invoice management capabilities.

## � Live Application

**Production URL**: [https://rechnung-meister-invoice-flow-jcm6c9xvg.vercel.app/](https://rechnung-meister-invoice-flow-jcm6c9xvg.vercel.app/)

## ✨ Features

### 📊 Complete Invoice Management
- **Create Professional Invoices** - Full invoice creation workflow with auto-generated invoice numbers
- **Client Management** - Comprehensive client database with company details and contact information
- **Service Catalog** - Predefined services with hourly rates and descriptions
- **Multi-Language Support** - German and English interface
- **PDF Generation** - Export invoices to professional PDF format

### 🏢 Multi-Company Support
- **Company-Based Data Isolation** - Separate data for different companies
- **User Role Management** - Owner, admin, and user permissions
- **Secure Authentication** - Supabase-powered user authentication

### 📈 Database Operations
- **Clients Database** - Fully populated with company information, addresses, and contact details
- **Services Database** - Complete catalog of billable services with rates and currencies
- **Invoices Database** - Historical invoice data with status tracking
- **Real-time Updates** - Live data synchronization across the application

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Vercel
- **Build Tool**: Vite

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/ofirwie/rechnung-meister-invoice-flow.git

# Navigate to project directory
cd rechnung-meister-invoice-flow

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📋 Application Structure

### Core Components
- **InvoiceForm** - Complete invoice creation interface
- **ClientManagement** - Client database management
- **ServiceManagement** - Service catalog administration  
- **InvoiceHistory** - View and manage past invoices
- **CompanySelector** - Multi-company switching

### Database Schema
- **companies** - Company information and settings
- **clients** - Client contact and billing information
- **services** - Billable services with rates
- **invoices** - Invoice records with line items
- **company_users** - User permissions per company

## 🐛 Debug Tools

For troubleshooting and diagnostics:

### Emergency Debug Routes
- **`/debug.html`** - Direct HTML diagnostic page (bypasses React Router)
- **`/simple-debug`** - Basic React app connectivity test
- **`/debug-white-screen`** - Comprehensive application diagnostics
- **`/debug-minimal`** - Lightweight debugging interface

### Debugging Features
- Real-time render tracking
- Component state monitoring  
- Database connection testing
- Authentication status verification
- Network connectivity checks

## 🔐 Authentication & Permissions

- **Supabase Auth** - Email/password authentication
- **Role-Based Access** - Owner, admin, user permissions
- **Company Isolation** - Users can only access their company's data
- **Secure API** - Row-level security policies

## 📱 User Interface

### Modern Design
- **Responsive Layout** - Works on desktop and mobile
- **Professional Styling** - Clean, business-focused design
- **Intuitive Navigation** - Easy-to-use interface
- **Real-time Feedback** - Loading states and success messages

### Key Features
- Auto-generated invoice numbers
- Date picker integrations  
- Currency selection (EUR, USD, ILS)
- Service period tracking
- Client address management

## 🚀 Deployment

The application is deployed on Vercel with:
- **Automatic deployments** from GitHub main branch
- **Environment variables** configured for Supabase
- **Custom domain** support available
- **SSL/HTTPS** enabled by default

## 📞 Support & Troubleshooting

### Common Issues
1. **Authentication Problems** - Use `/debug.html` to verify login status
2. **Data Loading Issues** - Check `/simple-debug` for database connectivity
3. **Render Problems** - Use comprehensive diagnostics at `/debug-white-screen`

### Debug Information
All debug tools provide user-friendly interfaces with:
- Copy-to-clipboard functionality
- Clear error messages
- Step-by-step troubleshooting guides
- No technical console knowledge required

## 📈 System Status

✅ **Fully Operational**
- Database: Populated with clients, services, and invoices
- Authentication: Working with user permissions
- Invoice Creation: Complete workflow functional
- Multi-company: Company isolation working
- Deployment: Live and accessible

---

**Built with ❤️ for professional invoice management**
