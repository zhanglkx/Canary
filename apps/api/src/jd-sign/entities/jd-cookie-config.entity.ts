/**
 * 京东 Cookie 配置实体
 *
 * @description
 * 用于存储京东签到的 Cookie 配置信息
 * 支持多个账号的 Cookie 管理
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Cookie 状态枚举
 */
export enum CookieStatus {
  ACTIVE = 'active', // 激活状态
  INACTIVE = 'inactive', // 未激活
  EXPIRED = 'expired', // 已过期
}

@Entity('jd_cookie_config')
@Index('IDX_cookie_account', ['account'])
@Index('IDX_cookie_status', ['status'])
export class JdCookieConfig {
  /**
   * 配置 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 账号标识（如 pt_pin 值或自定义账号名）
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  account: string;

  /**
   * 完整的 Cookie 字符串
   */
  @Column({ type: 'text' })
  cookie: string;

  /**
   * Cookie 状态
   */
  @Column({
    type: 'enum',
    enum: CookieStatus,
    default: CookieStatus.ACTIVE,
  })
  status: CookieStatus;

  /**
   * 备注信息（可选）
   */
  @Column({ type: 'text', nullable: true })
  remark?: string;

  /**
   * 最后验证时间（最后成功签到的时间）
   */
  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt?: Date;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
