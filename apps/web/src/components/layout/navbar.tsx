'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ShoppingCart } from 'lucide-react';
import styles from './navbar.module.less';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.logo}>
              Learning App
            </Link>
            {isAuthenticated && (
              <div className={styles.navLinks}>
                <Link href="/dashboard" className={styles.navLink}>
                  仪表板
                </Link>
                <Link href="/todos" className={styles.navLink}>
                  待办事项
                </Link>
                <Link href="/categories" className={styles.navLink}>
                  分类管理
                </Link>

                {/* E-Commerce Menu */}
                <div className={styles.ecommerceMenu}>
                  <Link href="/shop" className={styles.navLink}>
                    🛍️ Shop
                  </Link>
                  <Link href="/cart" className={styles.navLinkWithIcon}>
                    <ShoppingCart size={18} />
                    Cart
                  </Link>
                  <Link href="/orders" className={styles.navLink}>
                    📦 Orders
                  </Link>
                </div>

                <a
                  href="http://localhost:4000/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.navLink}
                  title="API Documentation"
                >
                  🔧 API
                </a>
              </div>
            )}
          </div>

          <div className={styles.rightSection}>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link href="/profile" className={styles.userLink}>
                  👤 {user?.username}
                </Link>
                <button onClick={handleLogout} className={styles.navLink}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.navLink}>
                  登录
                </Link>
                <Link href="/register" className={styles.registerButton}>
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
