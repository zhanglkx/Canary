# Quick Start Guide

This guide will help you get the project up and running in under 5 minutes.

## Prerequisites Check

```bash
node --version   # Should be 20+
pnpm --version   # Should be 9+
docker --version # Should be installed
```

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Start the Database

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Wait about 10 seconds for PostgreSQL to initialize.

## Step 3: Start the Backend

Open a terminal and run:

```bash
pnpm dev:api
```

You should see:
```
🚀 Server is running on http://localhost:4000/graphql
```

## Step 4: Start the Frontend

Open another terminal and run:

```bash
pnpm dev:web
```

You should see:
```
  ▲ Next.js 15.x
  - Local:        http://localhost:3000
```

## Step 5: Test the Application

1. Open http://localhost:3000 in your browser
2. Click on "Register" to create an account
3. After registration, you'll be logged in automatically
4. Try creating some todos!

## GraphQL Playground

Visit http://localhost:4000/graphql to explore the API directly.

Try this mutation to register:

```graphql
mutation {
  register(registerInput: {
    email: "test@example.com"
    username: "testuser"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      username
    }
  }
}
```

## Next Steps

Now that everything is running, you can:

1. Explore the code in `apps/api/src` (Backend)
2. Explore the code in `apps/web/src` (Frontend)
3. Check out the README.md for detailed documentation
4. Modify the code and see hot-reload in action!

## Stopping Everything

```bash
# Stop backend: Ctrl+C in the terminal running it
# Stop frontend: Ctrl+C in the terminal running it
# Stop database:
docker-compose -f docker-compose.dev.yml down
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Run both API and web concurrently
pnpm dev

# Run only API
pnpm dev:api

# Run only web
pnpm dev:web

# Build everything
pnpm build

# Start database only
docker-compose -f docker-compose.dev.yml up -d

# Start full stack with Docker
docker-compose up --build
```

## Troubleshooting

### Port 4000 or 3000 already in use
Kill the process using that port or change the port in the config.

### Database connection error
Make sure Docker is running and the database container is healthy:
```bash
docker ps
```

### Module not found
Delete node_modules and reinstall:
```bash
rm -rf node_modules apps/*/node_modules libs/*/node_modules
pnpm install
```

Happy coding!
