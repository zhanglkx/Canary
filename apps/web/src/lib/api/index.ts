/**
 * API Services Index
 * 统一导出所有 API 服务
 */

// 基础服务
export * from './auth.api';
export * from './user.api';

// 核心功能 - 分类要先于 todo 导出，因为 todo 依赖 category 类型
export * from './category.api';
export * from './todo.api';
export * from './comment.api';
export * from './tag.api';

// 电商功能
export * from './product.api';
export * from './cart.api';
export * from './order.api';

// 搜索功能
export * from './search.api';

// 便捷导出
export { authApi } from './auth.api';
export { userApi } from './user.api';
export { todoApi } from './todo.api';
export { categoryApi } from './category.api';
export { productApi } from './product.api';
export { cartApi } from './cart.api';
export { orderApi } from './order.api';
export { commentApi } from './comment.api';
export { tagApi } from './tag.api';
export { searchApi } from './search.api';
