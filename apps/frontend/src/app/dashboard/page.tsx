'use client';

import styles from '@/app/auth/login/auth.module.less';

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.formTitle}>Dashboard</h1>
        <p style={{ marginBottom: '1rem' }}>Welcome to your dashboard!</p>
      </div>
    </div>
  );
}
