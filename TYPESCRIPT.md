# TypeScript Configuration Guide

This project uses TypeScript 5.3+ with strict mode enabled across all packages.

## Base Configuration

### tsconfig.base.json
Root configuration inherited by all packages:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Package-Specific Configurations

### Frontend (apps/frontend/tsconfig.json)
- **target**: ES2022
- **module**: esnext
- **jsx**: preserve (for Next.js)
- **moduleResolution**: bundler
- **noEmit**: true (let Next.js handle compilation)

### Backend (apps/backend/tsconfig.json)
- **target**: ES2022
- **module**: commonjs (for Node.js)
- **outDir**: ./dist
- **declaration**: true (generate .d.ts files)
- **sourceMap**: true

### Shared Libraries
- **declaration**: true
- **declarationMap**: true
- **sourceMap**: true

## Type Safety

### Strict Mode Features

All packages have `strict: true` which enables:
- `noImplicitAny`: true
- `noImplicitThis`: true
- `alwaysStrict`: true
- `strictBindCallApply`: true
- `strictFunctionTypes`: true
- `strictNullChecks`: true
- `strictPropertyInitialization`: true

### Type Checking

Run type checking across monorepo:
```bash
pnpm run type-check
```

## Path Aliases

### Frontend
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@canary/shared-types": ["../../libs/shared-types/src"],
    "@canary/utils": ["../../libs/utils/src"]
  }
}
```

### Backend
```json
{
  "paths": {
    "src/*": ["src/*"],
    "@canary/shared-types": ["../../libs/shared-types/src"],
    "@canary/utils": ["../../libs/utils/src"]
  }
}
```

## Common Type Patterns

### Shared Types
```typescript
// From @canary/shared-types
import type { IUser, IAuthResponse, IApiResponse } from '@canary/shared-types';

// Use in both frontend and backend
interface ApiUser extends IUser { }
```

### DTO Validation
```typescript
// Backend DTO
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### API Response Handling
```typescript
// Consistent response typing
const response: IApiResponse<IUser> = await fetchAPI('/users/1');
if (response.data) {
  console.log(response.data.email);
}
```

## Type Inference

### Frontend Components
```typescript
// Type inference with React Server Components
export async function getUserData(id: string) {
  // Type is automatically inferred
  return await fetchAPI(`/users/${id}`);
}
```

### Backend Services
```typescript
// Service type inference
@Injectable()
export class UsersService {
  async findOne(id: string): Promise<User> {
    // Return type checked by TypeScript
    return this.usersRepository.findOne({ where: { id } });
  }
}
```

## Breaking Changes in TypeScript 5.3

This project is compatible with TS 5.3+:
- ✅ ESM interoperability
- ✅ Const type parameters
- ✅ Improved performance
- ✅ Enhanced IDE support

## Migration Tips

### From Previous TypeScript Versions

If upgrading from older versions:
```bash
# Update TypeScript
pnpm add -D typescript@latest

# Check for incompatibilities
pnpm run type-check

# Fix any issues
# Review breaking changes at: https://www.typescriptlang.org/docs/handbook/release-notes/
```

### Debugging Type Issues

```bash
# Show type of specific variable
hover over variable in IDE

# Check type hierarchy
# Use TypeScript compiler with --noEmit flag
```

## Best Practices

1. **Always use strict mode** - Prevent runtime errors
2. **Prefer interfaces over types** - Better for class implementation
3. **Use type narrowing** - Check types before operations
4. **Leverage inference** - Let TS deduce types when safe
5. **Use const assertions** - For literal types
6. **Document complex types** - Add JSDoc comments

## Performance Considerations

- TypeScript compilation is handled by build tools
- Use `skipLibCheck` to speed up compilation
- Leverage incremental compilation
- Keep dependencies up to date

---

For more information:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript 5.3 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html)
