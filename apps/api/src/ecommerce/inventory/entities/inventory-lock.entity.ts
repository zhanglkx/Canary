/**
 * 库存锁实体
 *
 * 用于分布式锁实现，处理极端并发场景
 *
 * 与乐观锁的区别：
 * - 乐观锁：假设并发不高，冲突时重试（ProductSku.version）
 * - 分布式锁：在高并发场景下，直接锁定资源，确保顺序执行
 *
 * 使用场景：
 * - 高并发库存抢购（秒杀）
 * - 库存批量操作
 * - 库存与订单的强一致性要求
 *
 * 实现策略：
 * 1. 尝试获取锁：INSERT INTO inventory_locks（原子操作）
 * 2. 如果插入成功，说明获得锁
 * 3. 执行业务逻辑（短事务）
 * 4. 删除锁记录（释放锁）
 * 5. 如果锁过期（超过TTL），其他请求可以获取
 *
 * @author Claude
 * @module Ecommerce/Inventory
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * 库存锁实体
 *
 * 记录谁在什么时间锁定了哪个SKU的库存
 * 用于防止同一时刻多个并发请求对同一SKU的库存操作
 */
@Entity('inventory_locks')
@Unique('UQ_inventory_sku_lock', ['skuId', 'lockType'])
@Index('IDX_inventory_lock_sku', ['skuId'])
@Index('IDX_inventory_lock_expiry', ['expiryTime'])
export class InventoryLock {
  /**
   * 锁ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * SKU ID（被锁定的资源）
   */
  @Column({ type: 'uuid' })
  skuId: string;

  /**
   * 锁类型
   *
   * - 'RESERVE': 预留库存锁
   * - 'DEDUCT': 扣减库存锁
   * - 'RESTOCK': 补货锁
   * - 'CHECK': 库存检查锁
   */
  @Column({ type: 'varchar', length: 20 })
  lockType: 'RESERVE' | 'DEDUCT' | 'RESTOCK' | 'CHECK';

  /**
   * 操作ID（订单ID、批次ID等）
   *
   * 用于识别是谁持有这个锁
   * 可以是订单ID、预订单ID等
   */
  @Column({ type: 'varchar', length: 100 })
  operationId: string;

  /**
   * 操作类型标识
   *
   * 用来区分不同的操作来源
   * 例如：ORDER, BATCH, RESTOCK_JOB等
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  operationType?: string;

  /**
   * 锁过期时间
   *
   * 防止死锁：如果持有者崩溃，锁会在此时间自动失效
   * 允许其他请求继续进行
   *
   * 通常设置为：当前时间 + TTL（如5分钟）
   */
  @Column({ type: 'timestamp' })
  expiryTime: Date;

  /**
   * 锁是否活跃
   *
   * false表示锁已过期或已主动释放
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * 锁创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 备注
   *
   * 记录锁的原因、持有者等信息
   */
  @Column({ type: 'text', nullable: true })
  remarks?: string;

  /**
   * 业务方法：检查锁是否已过期
   *
   * @returns true 如果锁已过期
   */
  isExpired(): boolean {
    return new Date() > this.expiryTime;
  }

  /**
   * 业务方法：检查锁是否仍然有效
   *
   * 有效 = 活跃且未过期
   *
   * @returns true 如果锁仍然有效
   */
  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }
}
