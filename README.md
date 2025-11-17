# Fixwell Services Platform

A unified full-stack application for fixwell services, combining Next.js frontend and Express.js backend in a single deployment.

## 🚀 Unified Deployment

This project is now configured for **single deployment** on Railway, eliminating the need for separate frontend and backend hosting.

### Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Express.js API with Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **Deployment**: Railway (unified)
- **Font**: JetBrains Mono (monospace throughout)

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database
- Python 3.11+ (optional, for Python tooling with Ruff)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd Fixwell
   npm install
   ```

2. **Environment variables:**
   Create `.env` files in both `apps/backend` and `apps/frontend` with:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
   JWT_SECRET="your-jwt-secret"
   STRIPE_SECRET_KEY="your-stripe-secret"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   ```

3. **Database setup:**
   ```bash
   cd apps/backend
   npx prisma generate
   npx prisma db push
   ```

4. **Python tooling (optional):**
   If you plan to use Python scripts or want to lint Python code with Ruff:
   ```bash
   # Install Python 3.11+ if not already installed
   # Then install Ruff
   pip install -r requirements-dev.txt
   
   # Or install Ruff directly
   pip install ruff
   ```

### Running the Application

#### Option 1: Unified Development (Recommended)
```bash
npm run dev:unified
```
This runs both frontend and backend in a single process on port 3000.

#### Option 2: Separate Development
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

#### Option 3: Concurrent Development
```bash
npm run dev
```

## 🚀 Deployment

### Railway Deployment (Unified)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy:**
   ```bash
   npm run deploy:unified
   ```

### Environment Variables for Production

Set these in your Railway project:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 📁 Project Structure

```
Fixwell/
├── apps/
│   ├── frontend/          # Next.js frontend
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── ...
│   └── backend/          # Express.js backend
│       ├── src/
│       │   ├── routes/   # API routes
│       │   ├── middleware/
│       │   └── ...
│       └── prisma/       # Prisma schema (PostgreSQL)
├── packages/             # Shared packages
├── unified-server.js     # Unified server script
├── Dockerfile           # Docker configuration
└── railway.json         # Railway configuration
```

## 🔧 Key Features

- **Unified Deployment**: Single Railway deployment for both frontend and backend
- **Monospace Typography**: JetBrains Mono font throughout the application
- **API Routes**: Backend API accessible at `/api/*`
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **Payments**: Stripe integration
- **Real-time**: WebSocket support for real-time features

## 🛠️ Scripts

- `npm run dev:unified` - Run unified development server
- `npm run build:unified` - Build both frontend and backend
- `npm run start:unified` - Start unified production server
- `npm run deploy:unified` - Deploy to Railway

## 🐍 Python Code Quality (Ruff)

This project includes Ruff configuration for Python code quality. Ruff is a fast Python linter and formatter.

### Setup

```bash
# Install Ruff
pip install ruff
# Or use the requirements file
pip install -r requirements-dev.txt
```

### Usage

```bash
# Check for linting issues
ruff check .

# Auto-fix issues
ruff check --fix .

# Format code
ruff format .

# Check specific file or directory
ruff check path/to/file.py
```

### Configuration

Ruff is configured via `pyproject.toml`. Key settings:
- Line length: 100 characters
- Target Python version: 3.11+
- Enabled rule sets: pycodestyle, pyflakes, isort, pep8-naming, pyupgrade, and more
- Excludes: node_modules, .next, build directories, etc.

## 🔗 API Endpoints

All API endpoints are available at `/api/*`:

- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management
- `/api/services/*` - Service management
- `/api/bookings/*` - Booking management
- `/api/payments/*` - Payment processing
- `/api/health` - Health check

## 🎨 Styling

The application uses:
- **Tailwind CSS** for styling
- **JetBrains Mono** as the primary font (monospace)
- **Custom CSS variables** for theming
- **Responsive design** for all screen sizes

## 📝 License

MIT License - see LICENSE file for details. 