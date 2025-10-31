import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CategoryStats {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  color: string;

  @Field()
  icon: string;

  @Field(() => Int)
  todoCount: number;

  @Field(() => Int)
  completedCount: number;
}
