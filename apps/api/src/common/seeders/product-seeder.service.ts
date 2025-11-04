/**
 * 产品种子数据服务
 *
 * 用于填充产品、分类、SKU和库存数据到数据库
 * 支持批量创建和检测重复数据
 *
 * @author Claude
 * @module Common/Seeders
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../ecommerce/product/entities/product.entity';
import { ProductCategory } from '../../ecommerce/product/entities/product-category.entity';
import { ProductSku } from '../../ecommerce/product/entities/product-sku.entity';
import { ProductAttribute } from '../../ecommerce/product/entities/product-attribute.entity';
import { ProductAttributeValue } from '../../ecommerce/product/entities/product-attribute-value.entity';
import { ProductImage } from '../../ecommerce/product/entities/product-image.entity';
import { PRODUCT_SEEDS, CATEGORY_SEEDS, ProductSeedData } from './product-seed';

/**
 * 产品种子数据服务
 */
@Injectable()
export class ProductSeederService {
  private readonly logger = new Logger(ProductSeederService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductSku)
    private skuRepository: Repository<ProductSku>,
    @InjectRepository(ProductAttribute)
    private attributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private attributeValueRepository: Repository<ProductAttributeValue>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
  ) {}

  /**
   * 执行完整的种子数据填充
   *
   * @returns 填充的产品数量
   */
  async seed(): Promise<number> {
    try {
      this.logger.log('开始产品种子数据填充...');

      // 1. 检查是否已有产品
      const existingProducts = await this.productRepository.count();
      if (existingProducts > 0) {
        this.logger.warn(
          `数据库中已存在 ${existingProducts} 个产品，跳过种子数据填充`,
        );
        return existingProducts;
      }

      // 2. 创建分类
      const categories = await this.seedCategories();
      this.logger.log(`✓ 创建了 ${categories.length} 个产品分类`);

      // 3. 创建产品、属性和SKU
      let totalSkus = 0;
      for (const seedData of PRODUCT_SEEDS) {
        const skuCount = await this.seedProduct(seedData, categories);
        totalSkus += skuCount;
      }

      this.logger.log(`✓ 产品种子数据填充完成！`);
      this.logger.log(`  - 产品数量: ${PRODUCT_SEEDS.length}`);
      this.logger.log(`  - SKU总数: ${totalSkus}`);

      return PRODUCT_SEEDS.length;
    } catch (error) {
      this.logger.error(`产品种子数据填充失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建产品分类
   *
   * @returns 创建的分类列表
   */
  private async seedCategories(): Promise<ProductCategory[]> {
    const categories: ProductCategory[] = [];

    for (const seedCategory of CATEGORY_SEEDS) {
      // 检查是否已存在
      const existing = await this.categoryRepository.findOne({
        where: { name: seedCategory.name },
      });

      if (existing) {
        categories.push(existing);
        continue;
      }

      // 生成slug（将名称转换为英文格式的URL友好名称）
      const slug = seedCategory.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[\u4E00-\u9FA5]+/g, (match) => {
          // 简单的汉字转拼音映射
          const pinyinMap: Record<string, string> = {
            衣: 'yi',
            服: 'fu',
            裤: 'ku',
            装: 'zhuang',
            鞋: 'xie',
            箱: 'xiang',
            包: 'bao',
            配: 'pei',
            饰: 'shi',
          };
          return Array.from(match)
            .map((char) => pinyinMap[char] || 'x')
            .join('-');
        });

      // 创建新分类
      const category = this.categoryRepository.create({
        name: seedCategory.name,
        description: seedCategory.description,
        slug: slug,
        isActive: true,
      });

      const saved = await this.categoryRepository.save(category);
      categories.push(saved);
      this.logger.debug(`  ✓ 分类 "${seedCategory.name}" 创建成功`);
    }

    return categories;
  }

  /**
   * 创建单个产品及其相关数据
   *
   * @param seedData 产品种子数据
   * @param categories 已创建的分类列表
   * @returns 创建的SKU数量
   */
  private async seedProduct(
    seedData: ProductSeedData,
    categories: ProductCategory[],
  ): Promise<number> {
    try {
      // 检查产品是否已存在
      const existingProduct = await this.productRepository.findOne({
        where: { sku: seedData.sku },
      });

      if (existingProduct) {
        this.logger.debug(`产品 "${seedData.name}" 已存在，跳过`);
        return 0;
      }

      // 找到对应的分类
      const category = categories.find((c) => c.name === seedData.categoryName);
      if (!category) {
        this.logger.warn(`分类 "${seedData.categoryName}" 未找到`);
        return 0;
      }

      // 创建产品
      const product = this.productRepository.create({
        name: seedData.name,
        description: seedData.description,
        sku: seedData.sku,
        basePrice: Math.round(seedData.basePrice * 100), // 转换为分
        categoryId: category.id,
        status: 'active',
      });

      const savedProduct = await this.productRepository.save(product);
      this.logger.debug(`✓ 产品 "${seedData.name}" 创建成功`);

      // 创建产品属性
      for (const attr of seedData.attributes) {
        // 生成代码（英文标识）
        const code = attr.name
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[\u4E00-\u9FA5]/g, 'cn');

        const productAttribute = this.attributeRepository.create({
          name: attr.name,
          code: `${code}-${Date.now()}`, // 确保唯一性
          type: 'select',
        });

        const savedAttribute = await this.attributeRepository.save(
          productAttribute,
        );

        // 创建属性值
        for (const value of attr.values) {
          const attributeValue = this.attributeValueRepository.create({
            value,
            attributeId: savedAttribute.id,
          });
          await this.attributeValueRepository.save(attributeValue);
        }
      }

      // 创建产品图片
      for (const imageData of seedData.images) {
        const image = this.imageRepository.create({
          url: imageData.url,
          altText: imageData.altText,
          productId: savedProduct.id,
        });
        await this.imageRepository.save(image);
      }

      // 创建SKU
      let skuCount = 0;
      for (const skuData of seedData.productSkus) {
        // 生成SKU名称（由属性值拼接）
        const skuName = Object.values(skuData.attributes).join('-');

        const sku = this.skuRepository.create({
          skuCode: skuData.code,
          skuName: skuName,
          productId: savedProduct.id,
          price: Math.round(skuData.price * 100), // 转换为分
          stock: skuData.stock,
          attributeValues: skuData.attributes,
        });

        await this.skuRepository.save(sku);
        skuCount++;
      }

      this.logger.debug(
        `  ✓ 产品 "${seedData.name}" 创建了 ${skuCount} 个SKU`,
      );
      return skuCount;
    } catch (error) {
      this.logger.error(`创建产品 "${seedData.name}" 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清空所有产品数据
   * 注意：只用于开发环境
   */
  async clearProducts(): Promise<void> {
    try {
      this.logger.log('清空所有产品数据...');

      // 删除顺序很重要，要先删除有外键约束的表
      await this.imageRepository.delete({});
      await this.attributeValueRepository.delete({});
      await this.attributeRepository.delete({});
      await this.skuRepository.delete({});
      await this.productRepository.delete({});
      await this.categoryRepository.delete({});

      this.logger.log('✓ 所有产品数据已清空');
    } catch (error) {
      this.logger.error(`清空产品数据失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 重新种子化（先清空再填充）
   */
  async reseed(): Promise<number> {
    await this.clearProducts();
    return this.seed();
  }
}
