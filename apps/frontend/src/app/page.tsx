import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome to Canary</h1>
        <p className={styles.subtitle}>
          Full-Stack Application: Next.js 16 + NestJS 11
        </p>

        <div className={styles.grid}>
          <a href="/auth/login" className={styles.card}>
            <h2>Authentication</h2>
            <p>Login / Register</p>
          </a>

          <a href="/dashboard" className={styles.card}>
            <h2>Dashboard</h2>
            <p>User Dashboard</p>
          </a>

          <a href="/api-docs" className={styles.card}>
            <h2>API Docs</h2>
            <p>Swagger Documentation</p>
          </a>
        </div>

        <footer className={styles.footer}>
          <p>Powered by Next.js 16 & NestJS 11</p>
        </footer>
      </div>
    </main>
  );
}
