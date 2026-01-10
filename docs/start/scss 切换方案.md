Next.js 使用 Sass/SCSS + CSS Modules 完整迁移指南
专为 Cursor AI 优化 - 从 Less 迁移到 SCSS 的完整配置方案
📋 目录
为什么从 Less 迁移到 SCSS
迁移前准备
安装和配置
语法迁移对照
完整的项目配置
样式文件迁移步骤
构建优化配置
常见问题解决
验证和测试
1. 为什么从 Less 迁移到 SCSS
当前 Less 方案的问题
根据你的配置，当前 Less 方案存在以下问题：
配置复杂：需要手动配置 webpack、MiniCssExtractPlugin
路径解析问题：需要使用 additionalData 手动处理 @/ 别名
HMR 不稳定：Less 热更新可能有延迟
生态萎缩：Less 社区活跃度低，未来支持不确定
构建性能：Less 编译速度较慢
SCSS 方案的优势
✅ Next.js 原生支持：零配置即可使用
✅ 路径别名自动支持：@/ 路径无需特殊处理
✅ 更好的 HMR：热更新快速稳定
✅ 功能更强大：@use、@forward 模块化
✅ 更好的性能：Dart Sass 编译快速
✅ 社区活跃：持续维护和更新
✅ 无需额外插件：不需要 MiniCssExtractPlugin
2. 迁移前准备
2.1 备份当前项目
# 创建备份分支
git checkout -b backup-before-scss-migration
git commit -am "备份：迁移到 SCSS 前的状态"

# 创建新的工作分支
git checkout -b feat/migrate-to-scss
2.2 了解当前项目结构
假设你的项目结构如下：
project/
├── src/
│   ├── app/
│   ├── components/
│   ├── styles/
│   │   ├── variables.less
│   │   ├── mixins.less
│   │   └── globals.css
│   └── types/
├── next.config.ts
└── package.json
2.3 记录需要迁移的文件
# 列出所有 Less 文件
find src -name "*.less" > less-files.txt
cat less-files.txt
3. 安装和配置
3.1 安装 Sass
# 卸载 Less 相关依赖
npm uninstall less less-loader mini-css-extract-plugin

# 安装 Sass
npm install sass

# 或使用其他包管理器
yarn add sass
pnpm add sass
3.2 更新 package.json
确保依赖正确：
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "sass": "^1.70.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
3.3 简化 next.config.ts
用以下配置完全替换你的 next.config.ts：
import type { NextConfig } from 'next';
import { execSync } from 'child_process';

// 生成构建信息（包含 Git 信息）
const generateBuildInfo = () => {
  const buildTime = new Date().toISOString();
  const buildTimestamp = Date.now().toString();

  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  let gitTag = 'unknown';

  try {
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git commit hash');
  }

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git branch');
  }

  try {
    const result = execSync('git describe --tags --exact-match HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    gitTag = result || 'no-tag';
  } catch (error) {
    gitTag = 'no-tag';
  }

  return {
    buildId: buildTimestamp,
    buildTime,
    gitCommit,
    gitBranch,
    gitTag,
  };
};

const buildInfo = generateBuildInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],

  // 生成构建 ID
  generateBuildId: async () => {
    return buildInfo.buildId;
  },

  // 将构建信息暴露为环境变量
  env: {
    BUILD_INFO: JSON.stringify(buildInfo),
    BUILD_ID: buildInfo.buildId,
    BUILD_TIME: buildInfo.buildTime,
    GIT_COMMIT: buildInfo.gitCommit,
    GIT_BRANCH: buildInfo.gitBranch,
    GIT_TAG: buildInfo.gitTag,
  },

  experimental: {
    optimizePackageImports: ['axios'],
  },

  // ✅ SCSS 原生支持，无需 webpack 配置！
  // Next.js 会自动处理 .scss 和 .module.scss 文件
  // 路径别名 @/ 自动支持
  // CSS Modules 自动支持
  // HMR 自动支持
  
  // 如果需要自定义 Sass 选项（可选）
  sassOptions: {
    // 添加额外的 include paths（如果需要）
    includePaths: ['./src/styles'],
    
    // Sass 编译选项
    silenceDeprecations: ['legacy-js-api'], // 静默旧 API 警告
  },
};

export default nextConfig;

关键变化说明：
❌ 删除了整个 webpack 配置：Next.js 原生支持 SCSS，无需手动配置
❌ 删除了 MiniCssExtractPlugin：Next.js 自动处理 CSS 提取
❌ 删除了路径解析的 hack：@/ 别名自动支持
✅ 保留了构建信息逻辑：你的 Git 信息和构建 ID 逻辑完全保留
✅ 添加了 sassOptions：可选的 Sass 编译选项
3.4 更新 TypeScript 类型声明
// src/types/styles.d.ts
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
4. 语法迁移对照
4.1 基础语法对照表
功能
Less
SCSS
说明
变量
@color: red;
$color: red;
@ 改为 $
访问变量
color: @color;
color: $color;
@ 改为 $
导入
@import 'file';
@use 'file' as *;
推荐用 @use
导入（旧）
@import 'file';
@import 'file';
兼容但不推荐
嵌套
&:hover { }
&:hover { }
完全相同
1/2


4.2 常见代码转换示例
变量定义
// Less (旧)
@primary-color: #0070f3;
@font-size-base: 14px;
@spacing-md: 16px;
// SCSS (新)
$primary-color: #0070f3;
$font-size-base: 14px;
$spacing-md: 16px;
导入其他文件
// Less (旧)
@import '@/styles/variables.less';
@import '@/styles/mixins.less';
// SCSS (新) - 推荐方式
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

// 或使用命名空间
@use '@/styles/variables' as vars;
@use '@/styles/mixins' as mx;

// 使用时
color: vars.$primary-color;
@include mx.flex-center;

// 或兼容旧语法（不推荐，但迁移期可用）
@import '@/styles/variables';
@import '@/styles/mixins';
Mixins 定义和使用
// Less (旧)
.flex-center() {
  display: flex;
  align-items: center;
  justify-content: center;
}
.button {
  .flex-center();
}
// 带参数的 mixin
.font-size(@size, @line-height: 1.5) {
  font-size: @size;
  line-height: @line-height;
}
.text {
  .font-size(14px);
}
// SCSS (新)
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.button {
  @include flex-center;
}

// 带参数的 mixin
@mixin font-size($size, $line-height: 1.5) {
  font-size: $size;
  line-height: $line-height;
}

.text {
  @include font-size(14px);
}
嵌套和父选择器
// Less (旧)
.button {
  color: @primary-color;
  
  &:hover {
    color: darken(@primary-color, 10%);
  }
  
  &.active {
    background: @primary-color;
  }
  
  .icon {
    margin-right: 8px;
  }
}
// SCSS (新) - 完全相同！
.button {
  color: $primary-color;
  
  &:hover {
    color: darken($primary-color, 10%);
  }
  
  &.active {
    background: $primary-color;
  }
  
  .icon {
    margin-right: 8px;
  }
}
插值（Interpolation）
// Less (旧)
@prefix: btn;
.@{prefix}-primary {
  color: blue;
}
// SCSS (新)
$prefix: btn;

.#{$prefix}-primary {
  color: blue;
}
颜色函数
// Less (旧)
@base-color: #0070f3;
.element {
  color: darken(@base-color, 10%);
  background: lighten(@base-color, 20%);
  border-color: fade(@base-color, 50%);
}
// SCSS (新)
$base-color: #0070f3;

.element {
  color: darken($base-color, 10%);
  background: lighten($base-color, 20%);
  border-color: rgba($base-color, 0.5); // fade() 改为 rgba()
}
5. 完整的项目配置
5.1 目录结构（迁移后）
project/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.scss              # 全局样式（CSS 改为 SCSS）
│   │   └── page.module.scss          # 页面样式
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss    # 组件样式
│   │   │   └── index.ts
│   │   └── Card/
│   │       ├── Card.tsx
│   │       ├── Card.module.scss
│   │       └── index.ts
│   ├── styles/
│   │   ├── _variables.scss           # 变量定义
│   │   ├── _mixins.scss              # 混合定义
│   │   ├── _functions.scss           # 函数定义
│   │   └── index.scss                # 统一导出
│   └── types/
│       └── styles.d.ts               # 类型声明
├── next.config.ts                    # 简化后的配置
├── tsconfig.json
└── package.json
5.2 全局变量文件
// src/styles/_variables.scss

// ============================================
// 颜色系统
// ============================================
$color-primary: #0070f3;
$color-success: #52c41a;
$color-warning: #faad14;
$color-error: #f5222d;
$color-info: #1890ff;

$color-text-primary: #333;
$color-text-secondary: #666;
$color-text-disabled: #999;

$color-bg-base: #fff;
$color-bg-light: #f5f5f5;
$color-bg-dark: #1a1a1a;
$color-border: #d9d9d9;

// ============================================
// 尺寸系统
// ============================================
$font-size-xs: 12px;
$font-size-sm: 13px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 18px;
$font-size-2xl: 20px;

$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;

$border-radius-sm: 2px;
$border-radius-base: 4px;
$border-radius-lg: 8px;
$border-radius-xl: 12px;

// ============================================
// 响应式断点
// ============================================
$breakpoint-xs: 480px;
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-2xl: 1600px;

// 或使用你的原有断点
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1280px;

// ============================================
// Z-index 层级
// ============================================
$z-index-base: 1;
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;

// ============================================
// 动画
// ============================================
$transition-base: all 0.3s ease;
$transition-fast: all 0.15s ease;
$transition-slow: all 0.5s ease;
5.3 Mixins 文件
// src/styles/_mixins.scss
@use './variables' as *;

// ============================================
// 布局 Mixins
// ============================================

// Flexbox 居中
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Flex 布局基础
@mixin flex($direction: row, $align: center, $justify: flex-start) {
  display: flex;
  flex-direction: $direction;
  align-items: $align;
  justify-content: $justify;
}

// ============================================
// 文本 Mixins
// ============================================

// 单行文本省略
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 多行文本省略
@mixin text-ellipsis-multiline($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ============================================
// 响应式 Mixins
// ============================================

@mixin mobile {
  @media (max-width: $breakpoint-mobile - 1px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: $breakpoint-mobile) and (max-width: $breakpoint-tablet - 1px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: $breakpoint-tablet) {
    @content;
  }
}

@mixin above($breakpoint) {
  @media (min-width: $breakpoint) {
    @content;
  }
}

@mixin below($breakpoint) {
  @media (max-width: $breakpoint - 1px) {
    @content;
  }
}

// ============================================
// 视觉效果 Mixins
// ============================================

// 阴影
@mixin shadow($level: 1) {
  @if $level == 1 {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  } @else if $level == 2 {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  } @else if $level == 3 {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
}

// 过渡动画
@mixin transition($properties: all, $duration: 0.3s, $timing: ease) {
  transition: $properties $duration $timing;
}

// ============================================
// 实用工具 Mixins
// ============================================

// 清除浮动
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

// 隐藏滚动条
@mixin hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

// 占位符样式
@mixin placeholder {
  &::-webkit-input-placeholder {
    @content;
  }
  &:-moz-placeholder {
    @content;
  }
  &::-moz-placeholder {
    @content;
  }
  &:-ms-input-placeholder {
    @content;
  }
}
5.4 Functions 文件
// src/styles/_functions.scss

// px 转 rem
@function px-to-rem($px, $base: 16px) {
  @return calc($px / $base) * 1rem;
}

// 颜色加深
@function shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}

// 颜色变浅
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

// 计算对比色（黑或白）
@function contrast-color($color) {
  $lightness: lightness($color);
  @if $lightness > 50% {
    @return #000;
  } @else {
    @return #fff;
  }
}
5.5 统一导出文件
// src/styles/index.scss
@forward './variables';
@forward './mixins';
@forward './functions';
6. 样式文件迁移步骤
6.1 批量重命名文件
# 方法 1：使用 find 命令（Mac/Linux）
find src -name "*.module.less" -exec sh -c 'mv "$0" "${0%.less}.scss"' {} \;

# 方法 2：手动重命名或使用 IDE
# VS Code: 右键 -> Rename -> 改扩展名

# 方法 3：使用 Node.js 脚本
node scripts/rename-less-to-scss.js

创建重命名脚本（可选）：
// scripts/rename-less-to-scss.js
const fs = require('fs');
const path = require('path');

function renameFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      renameFiles(fullPath);
    } else if (file.endsWith('.module.less')) {
      const newPath = fullPath.replace('.module.less', '.module.scss');
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    } else if (file.endsWith('.less') && !file.endsWith('.module.less')) {
      const newPath = fullPath.replace('.less', '.scss');
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    }
  });
}

renameFiles('./src');
console.log('Done!');
6.2 批量替换语法
创建转换脚本：
// scripts/convert-less-to-scss.js
const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. 替换变量定义 @var -> $var
  content = content.replace(/@([a-zA-Z0-9_-]+)\s*:/g, '$$$1:');
  
  // 2. 替换变量使用 @var -> $var
  content = content.replace(/@([a-zA-Z0-9_-]+)/g, '$$$1');
  
  // 3. 替换导入语句
  content = content.replace(/@import\s+['"](.+?)\.less['"]/g, '@use \'$1\' as *');
  content = content.replace(/@import\s+['"](.+?)['"]/g, '@use \'$1\' as *');
  
  // 4. 替换 mixin 定义
  content = content.replace(/\.([a-zA-Z0-9_-]+)\s*\((.*?)\)\s*\{/g, '@mixin $1($2) {');
  
  // 5. 替换 mixin 调用
  content = content.replace(/\.([a-zA-Z0-9_-]+)\s*\((.*?)\);/g, '@include $1($2);');
  content = content.replace(/\.([a-zA-Z0-9_-]+)\s*\(\);/g, '@include $1;');
  
  // 6. 替换插值 @{var} -> #{$var}
  content = content.replace(/@\{([^}]+)\}/g, '#{$$$1}');
  
  // 7. 替换 fade() 函数为 rgba()
  content = content.replace(/fade\(([^,]+),\s*(\d+)%\)/g, 'rgba($1, calc($2 / 100))');
  
  // 8. 恢复 @media、@keyframes 等 CSS at-rules
  content = content.replace(/\$media/g, '@media');
  content = content.replace(/\$keyframes/g, '@keyframes');
  content = content.replace(/\$supports/g, '@supports');
  content = content.replace(/\$charset/g, '@charset');
  content = content.replace(/\$font-face/g, '@font-face');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Converted: ${filePath}`);
}

function convertDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      convertDirectory(fullPath);
    } else if (file.endsWith('.scss')) {
      convertFile(fullPath);
    }
  });
}

convertDirectory('./src');
console.log('Conversion complete!');

运行脚本：
node scripts/convert-less-to-scss.js

⚠️ 注意：自动转换脚本可能不完美，需要手动检查和修复。
6.3 手动调整特殊情况
某些语法需要手动调整：
情况 1：extend 语法
// Less
.base-button {
  padding: 10px;
}
.primary-button {
  &:extend(.base-button);
  color: blue;
}
// SCSS - 使用 @extend
%base-button {
  padding: 10px;
}

.primary-button {
  @extend %base-button;
  color: blue;
}
情况 2：when 条件（Less 特有）
// Less
.button(@size) when (@size > 10px) {
  padding: @size;
}
// SCSS - 使用 @if
@mixin button($size) {
  @if $size > 10px {
    padding: $size;
  }
}
情况 3：each 循环
// Less
@sizes: 10px, 20px, 30px;
each(@sizes, {
  .size-@{value} {
    font-size: @value;
  }
});
// SCSS
$sizes: 10px, 20px, 30px;

@each $size in $sizes {
  .size-#{$size} {
    font-size: $size;
  }
}
6.4 更新组件导入语句
// 之前
import styles from './Button.module.less';

// 之后
import styles from './Button.module.scss';

使用 VS Code 全局替换：
按 Cmd/Ctrl + Shift + F
查找：.module.less
替换为：.module.scss
点击 "Replace All"
7. 构建优化配置
7.1 配置 Sass 选项
在 next.config.ts 中添加 Sass 选项（可选）：
const nextConfig: NextConfig = {
  // ... 其他配置
  
  sassOptions: {
    // 包含路径（用于简化导入）
    includePaths: ['./src/styles'],
    
    // 开发环境生成 source map
    sourceMap: process.env.NODE_ENV === 'development',
    
    // 静默警告
    silenceDeprecations: ['legacy-js-api'],
    
    // 输出样式（生产环境压缩）
    outputStyle: process.env.NODE_ENV === 'production' ? 'compressed' : 'expanded',
  },
};
7.2 CSS Modules 配置
虽然 Next.js 自动处理，但如果需要自定义类名格式：
// next.config.ts
const nextConfig: NextConfig = {
  // 实验性：自定义 CSS Modules 类名
  experimental: {
    // 注意：此功能可能在未来版本变化
  },
  
  // 如果需要更精细的控制，可以使用 webpack 配置
  webpack: (config, { dev }) => {
    // 查找 CSS loader 规则
    const rules = config.module.rules.find((rule) =>
      typeof rule === 'object' && rule.oneOf
    );

    if (rules) {
      rules.oneOf.forEach((rule) => {
        if (
          rule.use &&
          Array.isArray(rule.use) &&
          rule.use.some((loader) =>
            typeof loader === 'object' &&
            loader.loader &&
            loader.loader.includes('css-loader')
          )
        ) {
          rule.use.forEach((loader) => {
            if (
              typeof loader === 'object' &&
              loader.loader &&
              loader.loader.includes('css-loader') &&
              loader.options &&
              loader.options.modules
            ) {
              // 自定义类名格式
              loader.options.modules.localIdentName = dev
                ? '[name]__[local]--[hash:base64:5]'
                : '[hash:base64:8]';
            }
          });
        }
      });
    }

    return config;
  },
};

建议：保持默认配置即可，Next.js 的默认设置已经很优秀。
8. 常见问题解决
8.1 路径别名问题
问题：@/ 路径无法解析

解决方案：
// tsconfig.json - 确保配置正确
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
// SCSS 文件中直接使用（Next.js 自动支持）
@use '@/styles/variables' as *;

.button {
  color: $primary-color;
}
8.2 变量未定义错误
问题：Undefined variable $color-primary

原因：忘记导入变量文件

解决方案：
// ❌ 错误：未导入变量
.button {
  color: $primary-color; // 报错
}

// ✅ 正确：导入变量
@use '@/styles/variables' as *;

.button {
  color: $primary-color; // 正常
}
8.3 Mixin 未找到
问题：Undefined mixin flex-center

解决方案：
// 导入 mixins
@use '@/styles/mixins' as *;

.container {
  @include flex-center;
}
8.4 样式不生效
问题：修改样式后页面没有更新

解决方案：
# 1. 清除 Next.js 缓存
rm -rf .next

# 2. 重启开发服务器
npm run dev

# 3. 清除浏览器缓存
# Cmd/Ctrl + Shift + R 硬刷新
8.5 @use 与 @import 冲突
问题：混用 @use 和 @import 导致错误

解决方案：统一使用 @use
// ❌ 不要混用
@import '@/styles/variables';
@use '@/styles/mixins' as *;

// ✅ 全部使用 @use
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

// 或者全部使用 @import（不推荐但兼容）
@import '@/styles/variables';
@import '@/styles/mixins';
8.6 build 时报错但 dev 正常
问题：开发环境正常，生产构建失败

原因：可能使用了未定义的变量或 mixin

解决方案：
# 本地测试生产构建
npm run build

# 检查所有文件是否正确导入变量和 mixins
9. 验证和测试
9.1 创建测试组件
// src/components/Test/TestButton.tsx
import styles from './TestButton.module.scss';

export default function TestButton() {
  return (
    <div className={styles.container}>
      <button className={styles.primary}>Primary</button>
      <button className={styles.secondary}>Secondary</button>
    </div>
  );
}
// src/components/Test/TestButton.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-center;
  gap: $spacing-md;
  padding: $spacing-lg;
}

.primary {
  padding: $spacing-md $spacing-lg;
  background: $color-primary;
  color: white;
  border: none;
  border-radius: $border-radius-base;
  
  &:hover {
    background: darken($color-primary, 10%);
  }
}

.secondary {
  @extend .primary;
  background: $color-text-secondary;
  
  &:hover {
    background: darken($color-text-secondary, 10%);
  }
}
9.2 检查清单
[ ] ✅ 所有 .less 文件已重命名为 .scss
[ ] ✅ 所有 @ 变量已改为 $
[ ] ✅ @import 已改为 @use（或保持 @import）
[ ] ✅ Mixin 定义已改为 @mixin
[ ] ✅ Mixin 调用已改为 @include
[ ] ✅ 插值已改为 #{}
[ ] ✅ next.config.ts 已简化（删除 webpack Less 配置）
[ ] ✅ package.json 已移除 Less 依赖
[ ] ✅ TypeScript 类型声明已更新
[ ] ✅ 开发环境运行正常
[ ] ✅ 生产构建成功
[ ] ✅ 样式显示正确
[ ] ✅ HMR 热更新正常
9.3 运行测试
# 1. 清除缓存
rm -rf .next

# 2. 启动开发服务器
npm run dev

# 3. 检查是否有错误
# 浏览器控制台不应有样式相关错误

# 4. 测试热更新
# 修改 .scss 文件，保存后页面应立即更新

# 5. 生产构建测试
npm run build
npm run start

# 6. 检查构建产物
ls -lh .next/static/css/
# 应该看到 .css 文件，不应有 .less 文件
9.4 性能对比
迁移前后对比：
# 构建速度对比
time npm run build

# 打包体积对比
du -sh .next/static/css/

预期结果：
构建速度：SCSS 应该更快（10-30%）
打包体积：相似或略小
HMR 速度：明显更快
10. 迁移后清理
10.1 删除 Less 相关文件
# 确认没有遗留的 .less 文件
find src -name "*.less"

# 如果有，手动检查并删除
# rm src/path/to/old-file.less
10.2 更新文档
更新项目文档，说明现在使用 SCSS：
## 样式开发

项目使用 **Sass/SCSS + CSS Modules**

### 命名规范
- 组件样式：`ComponentName.module.scss`
- 全局样式：`globals.scss`
- 变量文件：`_variables.scss`

### 导入方式
```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;
示例
见 src/components/Button/Button.module.scss
### **10.3 提交代码**
```bash
# 查看更改
git status
# 添加所有文件
git add .
# 提交
git commit -m "feat: 迁移 Less 到 SCSS
- 安装 sass 依赖，移除 less 和 less-loader
- 简化 next.config.ts，删除 webpack Less 配置
- 重命名所有 .less 文件为 .scss
- 转换 Less 语法为 SCSS 语法
- 更新变量、mixins、functions
- 更新 TypeScript 类型声明
- 测试开发和生产环境
- 更新文档
Breaking Changes:
- 所有样式文件从 .less 改为 .scss
- @变量 改为 $变量
- @import 改为 @use
- Mixin 语法变更
"
# 推送到远程
git push origin feat/migrate-to-scss
11. Cursor AI 使用指南
11.1 提供给 Cursor 的 Prompt
我需要将 Next.js 项目从 Less 迁移到 SCSS。
当前配置：
- 使用 Less + CSS Modules
- 有复杂的 webpack 配置处理 Less
- 使用 @/ 路径别名
- 有自定义的 MiniCssExtractPlugin 配置
需要完成：
1. 安装 sass，卸载 less 和 less-loader
2. 简化 next.config.ts，删除 webpack Less 配置
3. 重命名所有 .module.less 文件为 .module.scss
4. 转换 Less 语法为 SCSS 语法：
   - @变量 -> $变量
   - @import -> @use
   - .mixin() -> @mixin 和 @include
   - @{} 插值 -> #{}
5. 保留现有的构建信息逻辑（Git commit、branch等）
6. 更新 TypeScript 类型声明
7. 测试确保样式正常工作
请逐步完成迁移，每次修改前先说明计划。
11.2 分步执行
让 Cursor 按以下顺序执行：
Step 1: 更新 package.json 依赖
Step 2: 简化 next.config.ts
Step 3: 更新 TypeScript 类型声明
Step 4: 重命名样式文件
Step 5: 转换语法
Step 6: 测试验证
12. 回滚方案
如果迁移出现问题：
# 回滚到迁移前的备份
git checkout backup-before-scss-migration

# 或者撤销特定提交
git revert HEAD

# 或者重置到特定提交
git reset --hard <commit-hash>
总结
关键优势
✅ 零配置：SCSS 无需 webpack 配置
✅ 更快：编译速度提升 10-30%
✅ 更稳定：HMR 更可靠
✅ 更简单：配置减少 90% 代码
✅ 更强大：@use、@forward 模块化
✅ 未来保障：持续维护和更新
迁移要点
安装 sass，删除 less 相关
简化 next.config.ts（删除 webpack Less 配置）
重命名 .less -> .scss
转换语法（@ -> $，@import -> @use）
测试验证
预计耗时：2-4 小时（取决于项目大小）

祝迁移顺利！🚀
(Powered By claude-sonnet-4-5)
Next.js 使用 Sass/SCSS 作为 CSS Modules 完整教程
目录
环境准备与依赖安装
Next.js 配置详解
SCSS 文件结构与命名规范
CSS Modules 使用方法
全局样式与变量配置
路径别名配置
迁移指南：从 Less 到 SCSS
常见问题与解决方案
性能优化建议
1. 环境准备与依赖安装
1.1 卸载 Less 相关依赖
npm uninstall less less-loader
1.2 安装 SCSS 相关依赖
npm install --save-dev sass sass-loader mini-css-extract-plugin

依赖说明：
sass：Dart Sass 编译器（推荐使用，性能更好）
sass-loader：Webpack loader，用于处理 SCSS 文件
mini-css-extract-plugin：提取 CSS 到独立文件，避免 FOUC（首屏无样式闪烁）
1.3 TypeScript 类型定义（可选但推荐）
npm install --save-dev @types/mini-css-extract-plugin
2. Next.js 配置详解
2.1 完整的 next.config.ts 配置
import type { NextConfig } from 'next';
import { execSync } from 'child_process';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

// 生成构建信息（包含 Git 信息）
const generateBuildInfo = () => {
  const buildTime = new Date().toISOString();
  const buildTimestamp = Date.now().toString();

  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  let gitTag = 'unknown';

  try {
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git commit hash');
  }

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git branch');
  }

  try {
    const result = execSync('git describe --tags --exact-match HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    gitTag = result || 'no-tag';
  } catch (error) {
    gitTag = 'no-tag';
  }

  return {
    buildId: buildTimestamp,
    buildTime,
    gitCommit,
    gitBranch,
    gitTag,
  };
};

const buildInfo = generateBuildInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],

  generateBuildId: async () => {
    return buildInfo.buildId;
  },

  // 将构建信息暴露为环境变量
  env: {
    BUILD_INFO: JSON.stringify(buildInfo),
    BUILD_ID: buildInfo.buildId,
    BUILD_TIME: buildInfo.buildTime,
    GIT_COMMIT: buildInfo.gitCommit,
    GIT_BRANCH: buildInfo.gitBranch,
    GIT_TAG: buildInfo.gitTag,
  },

  experimental: {
    optimizePackageImports: ['axios'],
  },

  // Webpack 配置 - 支持 SCSS CSS Modules
  webpack: (config, { dev, isServer }) => {
    const srcPath = path.resolve(__dirname, 'src');

    // 只在客户端处理 CSS
    if (!isServer) {
      // 添加 SCSS CSS Modules 规则
      config.module.rules.push({
        test: /\.module\.(scss|sass)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // 确保 HMR 在开发环境正常工作
              esModule: false,
            },
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                // 开发环境使用可读的类名，生产环境使用哈希
                localIdentName: dev 
                  ? '[name]__[local]--[hash:base64:5]' 
                  : '[hash:base64:8]',
                // 导出类名的格式
                exportLocalsConvention: 'camelCase',
              },
              sourceMap: dev,
              importLoaders: 2, // 在 css-loader 之前执行 2 个 loader
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: dev,
              sassOptions: {
                // 配置 SCSS 编译选项
                includePaths: [srcPath, path.resolve(__dirname, 'src/styles')],
                // 输出风格：开发环境 expanded，生产环境 compressed
                outputStyle: dev ? 'expanded' : 'compressed',
              },
              // 为每个 SCSS 文件自动注入全局变量和 mixins
              additionalData: `
                @import "@/styles/variables.scss";
                @import "@/styles/mixins.scss";
              `,
            },
          },
        ],
      });

      // 添加全局 SCSS 支持（非 CSS Modules）
      config.module.rules.push({
        test: /\.(scss|sass)$/,
        exclude: /\.module\.(scss|sass)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: dev,
              importLoaders: 1,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: dev,
              sassOptions: {
                includePaths: [srcPath, path.resolve(__dirname, 'src/styles')],
                outputStyle: dev ? 'expanded' : 'compressed',
              },
            },
          },
        ],
      });

      // 配置 MiniCssExtractPlugin
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: dev 
            ? 'static/css/[name].css' 
            : 'static/css/[name].[contenthash:8].css',
          chunkFilename: dev
            ? 'static/css/[name].chunk.css'
            : 'static/css/[name].[contenthash:8].chunk.css',
          // 忽略 CSS 顺序警告（CSS Modules 通常不需要担心顺序）
          ignoreOrder: true,
        }),
      );
    }

    // 确保路径别名配置
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = srcPath;
    }

    return config;
  },
};

export default nextConfig;
2.2 配置说明
关键配置项：
localIdentName：控制生成的 CSS 类名格式
开发环境：[name]__[local]--[hash:base64:5]，便于调试
生产环境：[hash:base64:8]，减小文件体积
exportLocalsConvention: 'camelCase'：允许使用驼峰命名导入类名
importLoaders: 2：确保 @import 和 url() 也通过 sass-loader 处理
additionalData：自动为每个 SCSS 文件注入全局变量和 mixins，无需手动导入
includePaths：配置 SCSS 的搜索路径，支持 @import 简写
3. SCSS 文件结构与命名规范
3.1 推荐的目录结构
src/
├── styles/
│   ├── globals.scss              # 全局样式
│   ├── variables.scss            # 全局变量（颜色、字体、间距等）
│   ├── mixins.scss               # 全局 mixins
│   ├── functions.scss            # 全局 functions
│   ├── reset.scss                # CSS 重置样式
│   └── themes/
│       ├── light.scss            # 浅色主题
│       └── dark.scss             # 深色主题
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.scss    # 组件样式（CSS Modules）
│   │   └── index.ts
│   └── Header/
│       ├── Header.tsx
│       ├── Header.module.scss
│       └── index.ts
└── pages/
    ├── _app.tsx
    ├── index.tsx
    └── home/
        ├── index.tsx
        └── home.module.scss      # 页面样式（CSS Modules）
3.2 命名规范
文件命名：
CSS Modules：*.module.scss 或 *.module.sass
全局样式：*.scss 或 *.sass
变量文件：variables.scss、_variables.scss（下划线开头表示部分文件）
Mixins 文件：mixins.scss、_mixins.scss
类名命名（推荐 BEM 规范）：
// Button.module.scss
.button {
  // 基础样式
  
  &__icon {
    // 元素
  }
  
  &--primary {
    // 修饰符
  }
  
  &--large {
    // 修饰符
  }
}
4. CSS Modules 使用方法
4.1 基础使用
组件文件：Button.tsx
import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'medium', 
  children 
}) => {
  return (
    <button 
      className={`${styles.button} ${styles[`button--${variant}`]} ${styles[`button--${size}`]}`}
    >
      {children}
    </button>
  );
};

export default Button;

样式文件：Button.module.scss
// 变量和 mixins 已通过 additionalData 自动注入，无需手动导入

.button {
  padding: $spacing-md $spacing-lg;
  border: none;
  border-radius: $border-radius-base;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &--primary {
    background-color: $color-primary;
    color: $color-white;
  }
  
  &--secondary {
    background-color: $color-secondary;
    color: $color-white;
  }
  
  &--small {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
  }
  
  &--large {
    padding: $spacing-lg $spacing-xl;
    font-size: $font-size-lg;
  }
}
4.2 使用 classnames 库优化类名拼接
安装：
npm install classnames
npm install --save-dev @types/classnames

使用示例：
import React from 'react';
import classNames from 'classnames';
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  children,
  className
}) => {
  return (
    <button 
      className={classNames(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        {
          [styles['button--disabled']]: disabled,
        },
        className // 允许外部传入额外的类名
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
4.3 使用驼峰命名（推荐）
由于配置了 exportLocalsConvention: 'camelCase'，可以使用驼峰命名：

样式文件：
.btn-primary {
  background-color: $color-primary;
}

.btn-large {
  padding: $spacing-lg;
}

组件中使用：
import styles from './Button.module.scss';
// 两种方式都可以
<button className={styles.btnPrimary}>按钮</button>
<button className={styles['btn-primary']}>按钮</button>
5. 全局样式与变量配置
5.1 全局变量文件：src/styles/variables.scss
// ==================== 颜色变量 ====================
// 主色
$color-primary: #1890ff;
$color-primary-light: #40a9ff;
$color-primary-dark: #096dd9;

// 辅助色
$color-secondary: #52c41a;
$color-success: #52c41a;
$color-warning: #faad14;
$color-error: #f5222d;
$color-info: #1890ff;

// 中性色
$color-white: #ffffff;
$color-black: #000000;
$color-gray-1: #fafafa;
$color-gray-2: #f5f5f5;
$color-gray-3: #e8e8e8;
$color-gray-4: #d9d9d9;
$color-gray-5: #bfbfbf;
$color-gray-6: #8c8c8c;
$color-gray-7: #595959;
$color-gray-8: #262626;

// 文本颜色
$color-text-primary: rgba(0, 0, 0, 0.85);
$color-text-secondary: rgba(0, 0, 0, 0.65);
$color-text-tertiary: rgba(0, 0, 0, 0.45);
$color-text-disabled: rgba(0, 0, 0, 0.25);

// 背景颜色
$color-bg-base: #ffffff;
$color-bg-light: #fafafa;
$color-bg-dark: #141414;

// ==================== 字体变量 ====================
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;

// 字体大小
$font-size-xs: 12px;
$font-size-sm: 14px;
$font-size-base: 16px;
$font-size-lg: 18px;
$font-size-xl: 20px;
$font-size-xxl: 24px;

// 字体粗细
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 700;

// 行高
$line-height-base: 1.5;
$line-height-tight: 1.25;
$line-height-loose: 1.75;

// ==================== 间距变量 ====================
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;

// ==================== 边框变量 ====================
$border-width-base: 1px;
$border-color-base: $color-gray-3;
$border-style-base: solid;

// 圆角
$border-radius-sm: 2px;
$border-radius-base: 4px;
$border-radius-lg: 8px;
$border-radius-circle: 50%;

// ==================== 阴影变量 ====================
$box-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
$box-shadow-base: 0 4px 8px rgba(0, 0, 0, 0.12);
$box-shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.16);

// ==================== 动画变量 ====================
$transition-duration-fast: 0.15s;
$transition-duration-base: 0.3s;
$transition-duration-slow: 0.5s;

$transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

// ==================== 响应式断点 ====================
$breakpoint-xs: 480px;
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-xxl: 1600px;

// ==================== Z-index 层级 ====================
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;
5.2 全局 Mixins：src/styles/mixins.scss
// ==================== 响应式 Mixins ====================
@mixin respond-to($breakpoint) {
  @if $breakpoint == xs {
    @media (max-width: $breakpoint-xs) { @content; }
  } @else if $breakpoint == sm {
    @media (min-width: $breakpoint-sm) { @content; }
  } @else if $breakpoint == md {
    @media (min-width: $breakpoint-md) { @content; }
  } @else if $breakpoint == lg {
    @media (min-width: $breakpoint-lg) { @content; }
  } @else if $breakpoint == xl {
    @media (min-width: $breakpoint-xl) { @content; }
  } @else if $breakpoint == xxl {
    @media (min-width: $breakpoint-xxl) { @content; }
  }
}

// ==================== Flexbox Mixins ====================
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

@mixin flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// ==================== 文本省略 Mixins ====================
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-ellipsis-multi($lines: 2) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: $lines;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ==================== 清除浮动 Mixin ====================
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

// ==================== 隐藏滚动条 Mixin ====================
@mixin hide-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
}

// ==================== 按钮重置 Mixin ====================
@mixin button-reset {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  
  &:focus {
    outline: none;
  }
}

// ==================== 绝对居中 Mixin ====================
@mixin absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

// ==================== 过渡效果 Mixin ====================
@mixin transition($property: all, $duration: $transition-duration-base, $timing: $transition-timing-function) {
  transition: $property $duration $timing;
}

// ==================== 阴影效果 Mixin ====================
@mixin box-shadow($shadow: $box-shadow-base) {
  box-shadow: $shadow;
}

// ==================== 圆角 Mixin ====================
@mixin border-radius($radius: $border-radius-base) {
  border-radius: $radius;
}
5.3 全局样式：src/styles/globals.scss
// 引入变量和 mixins（如果需要在全局样式中使用）
@import './variables.scss';
@import './mixins.scss';
@import './reset.scss';

// ==================== 全局样式 ====================
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  font-family: $font-family-base;
  font-size: $font-size-base;
  line-height: $line-height-base;
  color: $color-text-primary;
  background-color: $color-bg-base;
}

// 链接样式
a {
  color: $color-primary;
  text-decoration: none;
  transition: color $transition-duration-base;
  
  &:hover {
    color: $color-primary-light;
  }
}

// 标题样式
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
}

h1 { font-size: $font-size-xxl * 1.5; }
h2 { font-size: $font-size-xxl * 1.25; }
h3 { font-size: $font-size-xxl; }
h4 { font-size: $font-size-xl; }
h5 { font-size: $font-size-lg; }
h6 { font-size: $font-size-base; }

// 段落样式
p {
  margin: 0 0 $spacing-md;
}

// 图片样式
img {
  max-width: 100%;
  height: auto;
  display: block;
}

// 按钮样式重置
button {
  font-family: inherit;
}

// 输入框样式重置
input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}
5.4 在 _app.tsx 中引入全局样式
import '@/styles/globals.scss';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
6. 路径别名配置
6.1 TypeScript 配置：tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
6.2 在 SCSS 中使用路径别名
方式一：通过 includePaths 配置（推荐）

在 next.config.ts 中已配置 includePaths，可以直接使用：
// 在任何 .module.scss 文件中
@import 'styles/variables'; // 自动解析为 src/styles/variables.scss
@import 'styles/mixins';

方式二：使用波浪号 ~ 前缀（Webpack 约定）
@import '~@/styles/variables';
@import '~@/styles/mixins';

注意： 由于配置了 additionalData，通常不需要手动导入变量和 mixins。
7. 迁移指南：从 Less 到 SCSS
7.1 语法差异对照表
特性
Less
SCSS
变量定义
@primary-color: #1890ff;
$primary-color: #1890ff;
变量使用
color: @primary-color;
color: $primary-color;
嵌套
相同
相同
父选择器
&:hover
&:hover
混合（Mixins）
.mixin() {} 调用 .mixin();
@mixin mixin() {} 调用 @include mixin();
1/3


7.2 自动化迁移步骤
步骤 1：批量重命名文件
# Linux/Mac
find src -name "*.module.less" -exec bash -c 'mv "$0" "${0%.module.less}.module.scss"' {} \;

# Windows PowerShell
Get-ChildItem -Recurse -Filter *.module.less | Rename-Item -NewName { $_.Name -replace '\.module\.less$','.module.scss' }

步骤 2：批量替换变量符号

使用 VSCode 的查找替换功能（Ctrl+Shift+H）：
替换变量定义和使用：
查找：@([a-zA-Z0-9_-]+)（启用正则表达式）
替换：$$$1
替换 Mixin 定义：
查找：\.([a-zA-Z0-9_-]+)\s*\((.*?)\)\s*\{
替换：@mixin $1($2) {
替换 Mixin 调用：
查找：\.([a-zA-Z0-9_-]+)\((.*?)\);
替换：@include $1($2);
替换插值语法：
查找：@\{([a-zA-Z0-9_-]+)\}
替换：#{$$$1}
步骤 3：更新导入语句
// Less
@import '@/styles/variables.less';

// SCSS
@import '@/styles/variables.scss';
// 或者省略扩展名
@import '@/styles/variables';

步骤 4：调整特定语法

Less 的 when 条件：
.mixin(@size) when (@size > 10px) {
  font-size: @size;
}

SCSS 的 @if：
@mixin mixin($size) {
  @if $size > 10px {
    font-size: $size;
  }
}

Less 的循环（通过插件）：
.generate-columns(@n, @i: 1) when (@i =< @n) {
  .column-@{i} {
    width: (@i * 100% / @n);
  }
  .generate-columns(@n, (@i + 1));
}

SCSS 的 @for 循环：
@mixin generate-columns($n) {
  @for $i from 1 through $n {
    .column-#{$i} {
      width: ($i * 100% / $n);
    }
  }
}
7.3 使用 Cursor AI 进行迁移
将以下提示词提供给 Cursor：
请帮我将项目中所有的 Less 文件迁移到 SCSS：
1. 将所有 .module.less 文件重命名为 .module.scss
2. 将所有 .less 文件重命名为 .scss
3. 替换变量语法：将 @ 替换为 $
4. 替换 Mixin 语法：
   - 定义：.mixin() {} → @mixin mixin() {}
   - 调用：.mixin(); → @include mixin();
5. 替换插值语法：@{var} → #{$var}
6. 替换条件语法：when 语句 → @if 语句
7. 更新所有导入语句的文件扩展名
8. 更新组件中的样式导入语句
注意事项：
- 保持原有的类名和样式逻辑不变
- 确保 BEM 命名规范不被破坏
- 更新 TypeScript 导入语句中的文件路径
- 测试每个组件确保样式正常工作
7.4 迁移检查清单
[ ] 所有 .less 文件已重命名为 .scss
[ ] 所有 @ 变量已替换为 $ 变量
[ ] 所有 Mixin 定义和调用已更新
[ ] 所有插值语法已更新
[ ] 所有条件语句已更新
[ ] 所有导入语句已更新
[ ] next.config.ts 已更新为 SCSS 配置
[ ] package.json 中的依赖已更新
[ ] 全局样式文件已更新
[ ] 所有组件的样式导入已更新
[ ] 开发服务器运行正常
[ ] 生产构建成功
[ ] 样式在浏览器中显示正常
8. 常见问题与解决方案
8.1 样式不生效
问题： CSS Modules 类名没有正确应用

解决方案：
确认文件名是 .module.scss
检查导入语句：import styles from './Component.module.scss'
检查类名使用：className={styles.className}
查看浏览器开发者工具，确认类名是否被编译为哈希值
8.2 变量未定义错误
问题： 编译时提示变量未定义

解决方案：
检查 variables.scss 文件路径是否正确
确认 next.config.ts 中 additionalData 配置正确
如果某些文件不需要自动注入，使用 exclude 排除
手动导入方式：
@import '@/styles/variables';

.my-class {
  color: $color-primary;
}
8.3 路径别名不生效
问题： @/ 路径无法解析

解决方案：
确认 tsconfig.json 中配置了 paths
确认 next.config.ts 中配置了 resolve.alias
在 SCSS 中使用 ~@/ 或配置 includePaths
8.4 HMR（热更新）不工作
问题： 修改 SCSS 文件后页面不自动刷新

解决方案：
确认使用的是 MiniCssExtractPlugin 而不是 style-loader
检查 webpack 配置中的 esModule 选项
重启开发服务器
8.5 生产构建后样式丢失
问题： npm run build 后样式不显示

解决方案：
检查 _app.tsx 中是否导入了全局样式
确认 MiniCssExtractPlugin 正确配置
检查构建输出的 CSS 文件是否存在
查看浏览器控制台是否有 404 错误
8.6 CSS 顺序问题
问题： 样式优先级不正确

解决方案：
在 MiniCssExtractPlugin 配置中添加 ignoreOrder: true
使用更具体的选择器提高优先级
使用 !important（不推荐，最后手段）
8.7 第三方库样式冲突
问题： 第三方组件库样式被 CSS Modules 影响

解决方案：
确保第三方库的样式文件不匹配 .module.scss 规则
在 webpack 配置中排除 node_modules
全局样式使用普通 .scss 文件，不使用 CSS Modules
9. 性能优化建议
9.1 减少编译时间
1. 使用 Dart Sass（默认）
Dart Sass 比 Node Sass 性能更好，且是官方推荐。

2. 限制 additionalData 的内容
只自动注入必要的变量和 mixins，避免注入过多内容。

3. 使用缓存
// next.config.ts
webpack: (config, { dev }) => {
  if (dev) {
    config.cache = {
      type: 'filesystem',
    };
  }
  return config;
}
9.2 减小生产包体积
1. 启用 CSS 压缩
sassOptions: {
  outputStyle: 'compressed', // 生产环境
}

2. 移除未使用的 CSS（PurgeCSS）
npm install --save-dev @fullhuman/postcss-purgecss
// next.config.ts（添加 PostCSS 配置）
import purgecss from '@fullhuman/postcss-purgecss';

// 在 sass-loader 后添加 postcss-loader
{
  loader: 'postcss-loader',
  options: {
    postcssOptions: {
      plugins: [
        purgecss({
          content: ['./src/**/*.{js,jsx,ts,tsx}'],
          safelist: ['html', 'body'],
        }),
      ],
    },
  },
}

3. 使用 contenthash 缓存
filename: 'static/css/[name].[contenthash:8].css',
9.3 优化运行时性能
1. 避免嵌套过深
// ❌ 不推荐
.a {
  .b {
    .c {
      .d {
        .e {
          color: red;
        }
      }
    }
  }
}

// ✅ 推荐
.a__b__c__d__e {
  color: red;
}

2. 使用 CSS 变量（CSS Custom Properties）
:root {
  --color-primary: #{$color-primary};
}

.button {
  background-color: var(--color-primary);
}

这样可以在运行时动态修改，而不需要重新编译。

3. 延迟加载非关键 CSS
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
10. 完整示例项目结构
my-nextjs-app/
├── src/
│   ├── styles/
│   │   ├── globals.scss
│   │   ├── variables.scss
│   │   ├── mixins.scss
│   │   ├── functions.scss
│   │   └── reset.scss
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   ├── Card.module.scss
│   │   │   └── index.ts
│   │   └── Header/
│   │       ├── Header.tsx
│   │       ├── Header.module.scss
│   │       └── index.ts
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx
│   │   └── about/
│   │       ├── index.tsx
│   │       └── about.module.scss
│   └── utils/
│       └── classNames.ts
├── public/
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
11. 快速开始命令
# 1. 卸载 Less
npm uninstall less less-loader

# 2. 安装 SCSS
npm install --save-dev sass sass-loader mini-css-extract-plugin

# 3. 安装辅助库
npm install classnames
npm install --save-dev @types/classnames @types/mini-css-extract-plugin

# 4. 更新配置文件（使用上述 next.config.ts）

# 5. 重命名文件（选择你的操作系统命令）

# 6. 启动开发服务器
npm run dev

# 7. 构建生产版本
npm run build
12. 总结
这份教程涵盖了在 Next.js 中使用 Sass/SCSS 作为 CSS Modules 的所有关键内容：
✅ 完整的依赖安装和配置
✅ 详细的 webpack 配置说明
✅ 全局变量、mixins、函数的最佳实践
✅ CSS Modules 的正确使用方法
✅ 路径别名配置
✅ 从 Less 到 SCSS 的完整迁移指南
✅ 常见问题的解决方案
✅ 性能优化建议
关键要点：
使用 mini-css-extract-plugin 避免 FOUC
配置 additionalData 自动注入全局变量
使用 classnames 库优化类名拼接
遵循 BEM 命名规范
合理使用 CSS Modules 和全局样式
后续步骤：
将此配置应用到你的项目
使用 Cursor AI 进行批量迁移
逐个测试组件确保样式正常
优化性能和包体积
如有任何问题，请根据第 8 节的常见问题进行排查。