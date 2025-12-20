'use client';

import styles from './auth.module.css';

export default function LoginPage() {
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login submitted');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Sign In
          </button>
        </form>
        <p>
          Don't have an account?{' '}
          <a href="/auth/register">Register here</a>
        </p>
      </div>
    </div>
  );
}
