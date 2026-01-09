'use client';

import { InputHTMLAttributes, useEffect, useState } from 'react';
import styles from './input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 为了避免水合不匹配，我们在客户端渲染时添加一个 key
  const inputKey = isClient ? 'client-input' : 'server-input';

  const inputClass = error ? styles.inputError : styles.input;

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <input
        key={inputKey}
        className={`${inputClass} ${className}`}
        // 添加 suppressHydrationWarning 来抑制水合警告
        suppressHydrationWarning={true}
        {...props}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
