'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';
import styles from './page.module.less';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.accessToken, response.user);
      router.push('/todos');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Sign in to your account
          </h2>
          <p className={styles.subtitle}>
            Or{' '}
            <Link href="/register">
              create a new account
            </Link>
          </p>
        </div>
        <NoSSR fallback={<div className={styles.skeleton}>
          <div>
            <div className={styles.skeletonItem}></div>
            <div className={styles.skeletonItem}></div>
          </div>
          <div className={styles.skeletonButton}></div>
        </div>}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className={styles.fullWidth} variant="primary">
              Sign in
            </Button>

            <div className={styles.demoCredentials}>
              <p>Demo Credentials:</p>
              <p className={styles.monospace}>Email: admin@admin.com</p>
              <p className={styles.monospace}>Password: password</p>
            </div>
          </form>
        </NoSSR>
      </div>
    </div>
  );
}
