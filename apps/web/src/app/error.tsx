'use client';

import Link from 'next/link';
import styles from './error.module.less';

export default function ErrorPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>Something went wrong!</h1>
        <p className={styles.description}>
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            Go Home
          </Link>
          <button
            className={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
