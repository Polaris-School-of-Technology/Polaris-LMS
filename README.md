# Polaris LMS Frontend

Modern React-based Learning Management System frontend for Polaris with TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🔐 **Authentication**: JWT-based auth with refresh token support
- 📊 **Dashboard**: Comprehensive admin dashboard with real-time metrics
- 👨‍🏫 **Faculty Management**: Invite, manage, and track faculty members
- 📚 **Program Management**: Create and manage educational programs
- 👨‍🎓 **Student Management**: Track students with pagination and metrics
- 🚨 **Alerts System**: Dynamic alerts based on real-time data
- 📈 **Reports**: Comprehensive reporting with filtering capabilities
- 🔄 **Real-time Updates**: Live data from UMS backend
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Plus Jakarta Sans** - Modern typography

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Polaris UMS backend running on port 10000

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Polaris-LMS

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

Create a `.env` file in the root directory with your configuration:

```env
# Backend API URLs
UMS_BASE_URL=http://localhost:10000
LMS_BASE_URL=https://live-class-lms1-672553132888.asia-south1.run.app
MULTIMEDIA_BASE_URL=http://localhost:3002

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
APP_NAME=Polaris LMS
APP_VERSION=1.0.0
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UMS_BASE_URL` | User Management System API URL | `http://localhost:10000` |
| `LMS_BASE_URL` | Learning Management System API URL | `https://live-class-lms1-672553132888.asia-south1.run.app` |
| `MULTIMEDIA_BASE_URL` | Multimedia Service API URL | `http://localhost:3002` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `APP_NAME` | Application Name | `Polaris LMS` |
| `APP_VERSION` | Application Version | `1.0.0` |
| `NODE_ENV` | Environment (development/production) | `development` |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AlertsPanel.tsx     # Alerts management
│   ├── AuthForm.tsx        # Authentication forms
│   ├── MentorModal.tsx     # Faculty management modal
│   ├── ProgramDashboard.tsx # Program metrics dashboard
│   ├── StudentTable.tsx    # Student data table
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx     # Authentication state
├── pages/              # Page components
│   ├── Dashboard.tsx       # Main admin dashboard
│   ├── Landing.tsx         # Landing page
│   └── ...
├── services/           # API services
│   └── api.ts             # Centralized API client
├── types/              # TypeScript type definitions
│   └── index.ts           # Shared types
└── main.tsx            # Application entry point
```

## API Integration

The frontend integrates with three backend services:

### UMS (User Management System)
- Authentication and user management
- Faculty and student data
- Reports and analytics
- Alerts system

### LMS (Learning Management System)  
- Course content and sessions
- Assignment management
- Grade tracking

### Multimedia Service
- Video streaming and recording
- File uploads and management

## Authentication Flow

1. **Login**: User authenticates via email/password or Google OAuth
2. **Token Storage**: JWT access token and refresh token stored securely
3. **Auto Refresh**: Tokens automatically refreshed before expiration
4. **Route Protection**: Protected routes require authentication
5. **Role-based Access**: Admin, faculty, and student role permissions

## Key Components

### Dashboard
- Real-time metrics and KPIs
- Quick actions for common tasks
- Recent activity feed
- System alerts and notifications

### Faculty Management
- Invite new faculty members
- Assign to programs and batches
- Track performance metrics
- Manage permissions

### Program Management
- Create and edit programs
- Session scheduling
- Attendance tracking
- Progress monitoring

### Student Management
- Student enrollment
- Attendance tracking
- Performance analytics
- Bulk operations

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Code Quality

- **ESLint**: Code linting and formatting
- **TypeScript**: Type safety and IntelliSense
- **Prettier**: Code formatting (if configured)
- **Husky**: Git hooks for quality checks (if configured)

## Deployment

### Build Configuration

The app is configured for production deployment with:

- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Asset Optimization**: Minified CSS and JavaScript
- **Environment Variables**: Secure configuration management via Vite
- **Static Assets**: Optimized images and fonts
- **Type Safety**: Full TypeScript support with strict type checking

### Deployment Options

#### Static Hosting (Recommended)
```bash
# Set production environment variables
export UMS_BASE_URL=https://your-ums-backend.com
export LMS_BASE_URL=https://your-lms-backend.com
export MULTIMEDIA_BASE_URL=https://your-multimedia-backend.com
export NODE_ENV=production

# Build the app
npm run build

# Deploy dist/ folder to:
# - Vercel (set environment variables in dashboard)
# - Netlify (set environment variables in dashboard)
# - AWS S3 + CloudFront
# - GitHub Pages
```

**Note**: Make sure to set the environment variables in your hosting platform's dashboard for production deployments.

#### Docker Deployment
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Set environment variables for build
ENV UMS_BASE_URL=https://your-ums-backend.com
ENV LMS_BASE_URL=https://your-lms-backend.com
ENV MULTIMEDIA_BASE_URL=https://your-multimedia-backend.com
ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki