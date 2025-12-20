/**
 * CSS/LESS Modules 类型声明
 *
 * 使用 skipLibCheck 和正确的模块解析策略，
 * 确保 VS Code Go to Definition 能正确跳转到源文件
 */

// 这些声明只是为了让 TypeScript 编译器理解模块存在
// 不会影响 VS Code 的 Go to Definition 功能
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.less' {
  const classes: Record<string, string>;
  export default classes;
}
