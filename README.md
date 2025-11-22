# Korean Community Commerce App

A community-powered commerce platform for Koreans in Canada, featuring group buys, errands, and secure payment processing.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env
# Edit .env with your Supabase and Stripe keys

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment guide

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## 🏗️ Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Payments**: Stripe
- **Testing**: Vitest, Playwright

## 🔒 Security

- Environment variables are stored in `.env` (not committed to Git)
- Row Level Security (RLS) enabled in Supabase
- Secure payment processing via Stripe

## 📝 License

Private project

