# Frontend Development Guide

## Getting Started

### Installation
```bash
cd apps/frontend
pnpm install
```

### Development Server
```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── page.module.css     # Home page styles
│   ├── auth/
│   │   └── login/
│   │       ├── page.tsx
│   │       └── auth.module.css
│   └── dashboard/
│       └── page.tsx
```

## Styling

This project uses **CSS Modules** exclusively:

```tsx
// Import module
import styles from './page.module.css';

// Use in component
<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

## API Integration

Use the shared utility for API calls:

```tsx
'use client';

import { fetchAPI } from '@canary/utils';
import type { ILoginRequest, IAuthResponse } from '@canary/shared-types';

async function login(credentials: ILoginRequest) {
  const response = await fetchAPI<IAuthResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );
  return response;
}
```

## TypeScript

Use shared types for type safety:

```tsx
import type { IUser, IApiResponse } from '@canary/shared-types';

async function getUser(id: string): Promise<IUser> {
  const response = await fetchAPI<IApiResponse<IUser>>(`/users/${id}`);
  return response.data!;
}
```

## Testing

Run tests:
```bash
pnpm run test
pnpm run test:watch
```

## Linting

```bash
pnpm run lint
pnpm run type-check
```

## Build

```bash
pnpm run build
pnpm run start
```

## Features

- ✅ Next.js 16 with App Router
- ✅ CSS Modules for styling
- ✅ TypeScript strict mode
- ✅ API integration utilities
- ✅ Authentication flow
- ✅ Responsive design
- ✅ Jest testing
- ✅ ESLint & Prettier

## Environment Variables

See `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Debugging

### DevTools
Open browser DevTools to inspect elements and debug

### Next.js Debug Inspector
```bash
pnpm run dev -- --inspect
```

### VS Code Debugging
Add breakpoints and use debug console

## Performance Optimization

- Use Server Components by default
- Mark interactive components with `'use client'`
- Implement code splitting with dynamic imports
- Use CSS Modules for scoped styling
- Optimize images with Next.js Image component

## Common Issues

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Module not found
```bash
pnpm install
pnpm run type-check
```

### API connection issues
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify backend is running on port 4000
- Check CORS configuration in backend

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Features](https://react.dev/blog/2025/01/01/react-19)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
