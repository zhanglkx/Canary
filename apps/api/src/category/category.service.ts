import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CategoryStats } from './dto/category-stats.type';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryInput: CreateCategoryInput, userId: string): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryInput,
      userId,
      color: createCategoryInput.color || '#3B82F6',
      icon: createCategoryInput.icon || '📁',
    });
    return this.categoryRepository.save(category);
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      relations: ['todos'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['todos'],
    });

    if (!category) {
      throw new NotFoundException(`分类 ID ${id} 不存在`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryInput: UpdateCategoryInput,
    userId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);

    Object.assign(category, updateCategoryInput);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const category = await this.findOne(id, userId);

    // 检查是否有关联的 todos
    const todoCount = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.todos', 'todo')
      .where('category.id = :id', { id })
      .getCount();

    if (todoCount > 0) {
      throw new ForbiddenException('无法删除包含待办事项的分类，请先移动或删除相关待办事项');
    }

    await this.categoryRepository.remove(category);
    return true;
  }

  async getCategoryStats(userId: string): Promise<CategoryStats[]> {
    const rawStats = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.todos', 'todo')
      .where('category.userId = :userId', { userId })
      .select([
        'category.id as id',
        'category.name as name',
        'category.color as color',
        'category.icon as icon',
        'COUNT(todo.id) as todoCount',
        'COUNT(CASE WHEN todo.completed = true THEN 1 END) as completedCount',
      ])
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.color')
      .addGroupBy('category.icon')
      .getRawMany();

    return rawStats.map((stat) => ({
      id: stat.id,
      name: stat.name,
      color: stat.color,
      icon: stat.icon,
      todoCount: parseInt(stat.todoCount) || 0,
      completedCount: parseInt(stat.completedCount) || 0,
    }));
  }
}
