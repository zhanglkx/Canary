'use client';

import { useState, useEffect } from 'react';
import styles from './theme-toggle.module.scss';

export function ThemeToggle() {
    // 使用 mounted 状态确保服务端和客户端首次渲染一致
    const [mounted, setMounted] = useState(false);
    // 初始化状态：服务端始终为 false，客户端在 mounted 后读取
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // 组件挂载后，从 DOM 读取当前主题（由 layout.tsx 的阻塞脚本设置）
        setMounted(true);
        const currentIsDark = document.documentElement.classList.contains('dark');
        setIsDark(currentIsDark);

        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                // 只有在用户没有手动设置主题时才跟随系统
                setIsDark(e.matches);
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        // 清理函数
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    // 在客户端挂载前，返回一个占位符，避免 hydration 不匹配
    if (!mounted) {
        return (
            <button
                className={styles.button}
                aria-label="切换主题"
                disabled
            >
                <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={styles.button}
            aria-label="切换主题"
        >
            {isDark ? (
                <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            )}
        </button>
    );
}
