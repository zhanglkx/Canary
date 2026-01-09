'use client';

import Link from 'next/link';
import styles from './not-found.module.scss';

export default function NotFoundPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            Go Home
          </Link>
          <Link href="/shop" className={styles.secondaryButton}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
