# Environment Configuration

This directory contains environment-specific configuration files for the application.

## Files

- `environment.ts` - Development environment configuration
- `environment.prod.ts` - Production environment configuration

## Usage

Import the environment configuration in your services or components:

```typescript
import { environment } from '../environments/environment';

// Use environment variables
const apiUrl = environment.apiUrl;
const apiVersion = environment.apiVersion;
```

## Configuration

### Development (`environment.ts`)
- `apiUrl`: Development API endpoint (default: `http://localhost:3000/api`)
- `production`: Set to `false` for development

### Production (`environment.prod.ts`)
- `apiUrl`: Production API endpoint (update with your production URL)
- `production`: Set to `true` for production builds

## Building

- **Development**: `ng serve` (uses `environment.ts`)
- **Production**: `ng build --configuration production` (uses `environment.prod.ts`)

## Important Notes

1. Update the `apiUrl` in both files with your actual API endpoints
2. Never commit sensitive information (API keys, secrets) directly in environment files
3. For sensitive data, consider using environment variables or a secure configuration service

