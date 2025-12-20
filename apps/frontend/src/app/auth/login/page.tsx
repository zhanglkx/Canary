'use client';

import styles from './auth.module.less';

export default function LoginPage() {
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login submitted');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.formTitle}>Login</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email</label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              className={styles.formInput}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className={styles.formInput}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Sign In
          </button>
        </form>
        <div className={styles.formFooter}>
          Don't have an account?{' '}
          <a href="/auth/register" className={styles.formLink}>Register here</a>
        </div>
      </div>
    </div>
  );
}
