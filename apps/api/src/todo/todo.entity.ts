import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

registerEnumType(Priority, {
  name: 'Priority',
  description: 'Todo 优先级',
});

@Entity('todos')
@ObjectType()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  title: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column({ default: false })
  @Field()
  completed: boolean;

  @ManyToOne(() => User, (user) => user.todos)
  @Field(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Category, (category) => category.todos, { nullable: true })
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @Field(() => Priority)
  priority: Priority;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => String, { nullable: true })
  dueDate?: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
