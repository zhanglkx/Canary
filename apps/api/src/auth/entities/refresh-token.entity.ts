/**
 * RefreshToken Entity - 刷新令牌管理
 *
 * 用于存储和管理 JWT 刷新令牌，支持:
 * - 长期刷新令牌存储
 * - 令牌撤销（登出）
 * - 令牌过期管理
 * - 单个用户的多个令牌（多设备登录）
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked']) // 查询用户的有效令牌时优化
@Index(['expiresAt']) // 过期令牌清理
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ nullable: true })
  userAgent?: string; // 用于识别设备

  @Column({ nullable: true })
  ipAddress?: string; // 用于安全审计

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  revokedAt?: Date; // 令牌被撤销的时间
}
