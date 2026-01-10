/**
 * 京东签到历史实体
 *
 * @description
 * 用于记录每次签到的结果，包括成功/失败状态、响应信息等
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JdSignStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('jd_sign_history')
export class JdSignHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 签到状态
   */
  @Column({
    type: 'enum',
    enum: JdSignStatus,
    default: JdSignStatus.PENDING,
  })
  status: JdSignStatus;

  /**
   * 签到响应数据（JSON 格式）
   */
  @Column({ type: 'text', nullable: true })
  responseData: string;

  /**
   * 错误信息（如果签到失败）
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  /**
   * 签到时间
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  signTime: Date;

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
