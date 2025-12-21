/**
 * ProductController - 产品控制器
 */

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: any, @CurrentUser() user: User) {
    return this.productService.createProduct(createProductDto, user.id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.productService.getProducts(query);
  }

  @Get('stats')
  async getStats() {
    return this.productService.getProductStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.productService.deleteProduct(id);
    return { success: true };
  }
}
