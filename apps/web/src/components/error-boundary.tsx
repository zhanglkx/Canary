'use client';

import React from 'react';
import styles from './error-boundary.module.less';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // 更新 state 使下一次渲染能够显示降级后的 UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 你同样可以将错误日志上报给服务器
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // 如果是水合错误，尝试重新渲染
        if (error.message.includes('hydration') || error.message.includes('Hydration')) {
            console.warn('Hydration error detected, attempting to recover...');
            // 延迟重置错误状态，让组件重新渲染
            setTimeout(() => {
                this.setState({ hasError: false, error: undefined });
            }, 100);
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            // 你可以自定义降级后的 UI 并渲染
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            return (
                <div className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.textCenter}>
                            <h2 className={styles.title}>
                                出现了一些问题
                            </h2>
                            <p className={styles.description}>
                                页面加载时遇到错误，请尝试刷新页面。
                            </p>
                            <button
                                onClick={this.resetError}
                                className={styles.retryButton}
                            >
                                重试
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
