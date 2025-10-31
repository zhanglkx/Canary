import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { Todo } from '../todo/todo.entity';

@Entity('categories')
@ObjectType()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column({ default: '#3B82F6' }) // 默认蓝色
  @Field()
  color: string;

  @Column({ default: '📁' }) // 默认文件夹图标
  @Field()
  icon: string;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  @Field(() => User)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Todo, (todo) => todo.category)
  @Field(() => [Todo], { nullable: true })
  todos?: Todo[];

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
