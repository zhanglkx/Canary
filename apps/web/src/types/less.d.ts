declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// 如果还有遗留的 Less 类型声明，可以保留但标记为废弃
/** @deprecated 迁移到 SCSS 后移除 */
declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}
