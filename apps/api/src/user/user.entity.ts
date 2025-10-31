import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';
import { Todo } from '../todo/todo.entity';
import { Category } from '../category/category.entity';

@Entity('users')
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  email: string;

  @Column()
  @Field()
  username: string;

  @Column()
  @HideField()
  password: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  @Field(() => [Todo], { nullable: true })
  todos?: Todo[];

  @OneToMany(() => Category, (category) => category.user)
  @Field(() => [Category], { nullable: true })
  categories?: Category[];

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
