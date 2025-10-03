# Yardvark

A lawn care app for LCNs built in Angular and Nest.js! Check out the initial release below for some notes and screenshots!
![yardvark](https://github.com/user-attachments/assets/cca60b38-86d4-421f-94eb-369a29c4a47e)

https://github.com/johnsonav1992/yardvark/releases/tag/v1.0.0-beta

## 🔒 Security

Yardvark implements comprehensive security measures for production use:

- ✅ JWT Authentication with Auth0
- ✅ Rate Limiting (100 requests/min per IP)
- ✅ Security Headers (Helmet)
- ✅ Input Validation & Sanitization
- ✅ CORS Protection
- ✅ SQL Injection Prevention (TypeORM)
- ✅ Feature Flag System

**Important Documentation**:
- 📖 [SECURITY.md](./SECURITY.md) - Comprehensive security guide
- 📋 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-production deployment checklist
- ⚡ [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md) - Quick reference for developers
- 🔓 [ENABLE_PUBLIC_ACCESS.md](./auth0-actions/ENABLE_PUBLIC_ACCESS.md) - Guide for enabling public user registration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Auth0 account
- AWS S3 bucket (for file storage)

### Environment Setup

1. **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in your values
2. **Frontend**: Update environment files in `src/environments/` with your configuration

See `.env.example` files for required variables.

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Development

```bash
# Run frontend (from root)
npm start

# Run backend (from backend directory)
cd backend
npm run start:dev
```

## 📦 Tech Stack

**Frontend**:
- Angular 18+
- TypeScript
- Auth0 Angular SDK
- MapBox GL

**Backend**:
- NestJS
- TypeORM
- PostgreSQL
- Auth0 JWT
- AWS S3

**Security**:
- @nestjs/throttler (Rate limiting)
- Helmet (Security headers)
- class-validator (Input validation)
- Auth0 (Authentication)


