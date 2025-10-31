'use client';

import { useEffect, useState } from 'react';

interface NoSSRProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * NoSSR 组件用于防止服务端渲染，避免水合不匹配问题
 * 特别适用于包含浏览器特定功能或可能被浏览器扩展修改的组件
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
