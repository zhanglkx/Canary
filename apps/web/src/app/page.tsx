import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Learning NestJS + Next.js + GraphQL</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            A monorepo project for learning modern full-stack development
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/login"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Login</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access your todos
            </p>
          </Link>

          <Link
            href="/register"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Register</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new account to get started
            </p>
          </Link>

          <Link
            href="/todos"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Todos</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your todo list
            </p>
          </Link>

          <Link
            href="/categories"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Categories</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Organize with categories
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View statistics and insights
            </p>
          </Link>

          <a
            href="http://localhost:4000/graphql"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">GraphQL Playground</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore the GraphQL API
            </p>
          </a>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-500 space-y-2">
          <p>Tech Stack:</p>
          <p>NestJS 10 • Next.js 15 • GraphQL • TypeScript • PostgreSQL • Docker</p>
        </div>
      </main>
    </div>
  );
}
