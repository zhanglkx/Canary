/**
 * 产品种子数据
 *
 * 用于初始化数据库中的示例产品、SKU和库存数据
 * 支持开发和测试环境的快速数据填充
 *
 * @author Claude
 * @module Common/Seeders
 */

/**
 * 产品种子数据接口
 */
export interface ProductSeedData {
  name: string;
  description: string;
  sku: string;
  categoryName: string;
  basePrice: number; // 元
  images: {
    url: string;
    altText: string;
  }[];
  attributes: {
    name: string;
    values: string[];
  }[];
  productSkus: {
    code: string;
    attributes: Record<string, string>;
    price: number; // 元
    stock: number;
  }[];
}

/**
 * 产品种子数据列表
 *
 * 包含5个完整的产品示例，每个产品都有多个SKU变体
 */
export const PRODUCT_SEEDS: ProductSeedData[] = [
  {
    name: '经典棉质T恤',
    description: '舒适透气的100%纯棉T恤，适合日常穿着。质地柔软，洗涤后不易褪色。',
    sku: 'TSHIRT-001',
    categoryName: '衣服',
    basePrice: 89.99,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        altText: '经典棉质T恤正面',
      },
      {
        url: 'https://images.unsplash.com/photo-1529720317453-c2a01ced66e9?w=500&h=500&fit=crop',
        altText: '经典棉质T恤背面',
      },
    ],
    attributes: [
      {
        name: '颜色',
        values: ['黑色', '白色', '灰色', '蓝色', '红色'],
      },
      {
        name: '尺码',
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
    ],
    productSkus: [
      {
        code: 'TSHIRT-001-BK-M',
        attributes: { 颜色: '黑色', 尺码: 'M' },
        price: 89.99,
        stock: 50,
      },
      {
        code: 'TSHIRT-001-BK-L',
        attributes: { 颜色: '黑色', 尺码: 'L' },
        price: 89.99,
        stock: 45,
      },
      {
        code: 'TSHIRT-001-WH-M',
        attributes: { 颜色: '白色', 尺码: 'M' },
        price: 89.99,
        stock: 60,
      },
      {
        code: 'TSHIRT-001-WH-L',
        attributes: { 颜色: '白色', 尺码: 'L' },
        price: 89.99,
        stock: 55,
      },
      {
        code: 'TSHIRT-001-BL-M',
        attributes: { 颜色: '蓝色', 尺码: 'M' },
        price: 89.99,
        stock: 35,
      },
      {
        code: 'TSHIRT-001-BL-L',
        attributes: { 颜色: '蓝色', 尺码: 'L' },
        price: 89.99,
        stock: 40,
      },
    ],
  },
  {
    name: '休闲牛仔裤',
    description: '采用优质牛仔布制作，款式时尚，穿着舒适。适合各种场合穿着。',
    sku: 'JEANS-001',
    categoryName: '裤装',
    basePrice: 199.99,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop',
        altText: '休闲牛仔裤正面',
      },
    ],
    attributes: [
      {
        name: '颜色',
        values: ['深蓝', '浅蓝', '黑色'],
      },
      {
        name: '尺码',
        values: ['28', '30', '32', '34', '36'],
      },
    ],
    productSkus: [
      {
        code: 'JEANS-001-DB-30',
        attributes: { 颜色: '深蓝', 尺码: '30' },
        price: 199.99,
        stock: 25,
      },
      {
        code: 'JEANS-001-DB-32',
        attributes: { 颜色: '深蓝', 尺码: '32' },
        price: 199.99,
        stock: 30,
      },
      {
        code: 'JEANS-001-LB-30',
        attributes: { 颜色: '浅蓝', 尺码: '30' },
        price: 199.99,
        stock: 20,
      },
      {
        code: 'JEANS-001-LB-32',
        attributes: { 颜色: '浅蓝', 尺码: '32' },
        price: 199.99,
        stock: 28,
      },
      {
        code: 'JEANS-001-BK-30',
        attributes: { 颜色: '黑色', 尺码: '30' },
        price: 199.99,
        stock: 15,
      },
    ],
  },
  {
    name: '运动跑鞋',
    description: '专业运动设计，轻便舒适，提供卓越的缓冲性能。适合日常跑步和健身。',
    sku: 'SHOE-001',
    categoryName: '鞋类',
    basePrice: 599.99,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        altText: '运动跑鞋',
      },
    ],
    attributes: [
      {
        name: '颜色',
        values: ['黑红', '白蓝', '全黑', '全白'],
      },
      {
        name: '尺码',
        values: ['36', '37', '38', '39', '40', '41', '42', '43'],
      },
    ],
    productSkus: [
      {
        code: 'SHOE-001-BR-39',
        attributes: { 颜色: '黑红', 尺码: '39' },
        price: 599.99,
        stock: 18,
      },
      {
        code: 'SHOE-001-BR-40',
        attributes: { 颜色: '黑红', 尺码: '40' },
        price: 599.99,
        stock: 22,
      },
      {
        code: 'SHOE-001-WB-39',
        attributes: { 颜色: '白蓝', 尺码: '39' },
        price: 599.99,
        stock: 20,
      },
      {
        code: 'SHOE-001-WB-40',
        attributes: { 颜色: '白蓝', 尺码: '40' },
        price: 599.99,
        stock: 25,
      },
      {
        code: 'SHOE-001-BK-39',
        attributes: { 颜色: '全黑', 尺码: '39' },
        price: 599.99,
        stock: 12,
      },
      {
        code: 'SHOE-001-BK-40',
        attributes: { 颜色: '全黑', 尺码: '40' },
        price: 599.99,
        stock: 16,
      },
    ],
  },
  {
    name: '棉质连帽卫衣',
    description: '温暖舒适的连帽卫衣，采用优质棉质面料。口袋设计，穿着便利。',
    sku: 'HOODIE-001',
    categoryName: '衣服',
    basePrice: 279.99,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556821552-9f6db051193c?w=500&h=500&fit=crop',
        altText: '连帽卫衣',
      },
    ],
    attributes: [
      {
        name: '颜色',
        values: ['黑色', '灰色', '深蓝', '暗红'],
      },
      {
        name: '尺码',
        values: ['S', 'M', 'L', 'XL', 'XXL'],
      },
    ],
    productSkus: [
      {
        code: 'HOODIE-001-BK-M',
        attributes: { 颜色: '黑色', 尺码: 'M' },
        price: 279.99,
        stock: 40,
      },
      {
        code: 'HOODIE-001-BK-L',
        attributes: { 颜色: '黑色', 尺码: 'L' },
        price: 279.99,
        stock: 35,
      },
      {
        code: 'HOODIE-001-GR-M',
        attributes: { 颜色: '灰色', 尺码: 'M' },
        price: 279.99,
        stock: 38,
      },
      {
        code: 'HOODIE-001-GR-L',
        attributes: { 颜色: '灰色', 尺码: 'L' },
        price: 279.99,
        stock: 32,
      },
      {
        code: 'HOODIE-001-NV-M',
        attributes: { 颜色: '深蓝', 尺码: 'M' },
        price: 279.99,
        stock: 28,
      },
    ],
  },
  {
    name: '时尚休闲背包',
    description: '宽敞耐用的背包，多个收纳袋设计。适合出差、旅行和日常使用。',
    sku: 'BACKPACK-001',
    categoryName: '箱包',
    basePrice: 349.99,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
        altText: '休闲背包',
      },
    ],
    attributes: [
      {
        name: '颜色',
        values: ['黑色', '深灰', '军绿', '深红'],
      },
      {
        name: '尺寸',
        values: ['20L', '30L', '40L'],
      },
    ],
    productSkus: [
      {
        code: 'BACKPACK-001-BK-20L',
        attributes: { 颜色: '黑色', 尺寸: '20L' },
        price: 349.99,
        stock: 30,
      },
      {
        code: 'BACKPACK-001-BK-30L',
        attributes: { 颜色: '黑色', 尺寸: '30L' },
        price: 399.99,
        stock: 25,
      },
      {
        code: 'BACKPACK-001-GR-20L',
        attributes: { 颜色: '深灰', 尺寸: '20L' },
        price: 349.99,
        stock: 20,
      },
      {
        code: 'BACKPACK-001-GR-30L',
        attributes: { 颜色: '深灰', 尺寸: '30L' },
        price: 399.99,
        stock: 18,
      },
      {
        code: 'BACKPACK-001-MG-30L',
        attributes: { 颜色: '军绿', 尺寸: '30L' },
        price: 399.99,
        stock: 15,
      },
    ],
  },
];

/**
 * 产品分类种子数据
 */
export const CATEGORY_SEEDS = [
  {
    name: '衣服',
    description: '各类衣服和上装',
  },
  {
    name: '裤装',
    description: '各类裤装',
  },
  {
    name: '鞋类',
    description: '各类鞋品',
  },
  {
    name: '箱包',
    description: '旅行箱包和背包',
  },
  {
    name: '配饰',
    description: '帽子、围巾、手套等配饰',
  },
];
