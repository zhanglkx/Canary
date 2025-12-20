'use client';

import styles from './index.less';


export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.formWrapper}>
        <h1 className={styles.formTitle}>Dashboard</h1>
        <p style={{ marginBottom: '1rem' }}>Welcome to your dashboard!</p>
      </div>
    </div>
  );
}
