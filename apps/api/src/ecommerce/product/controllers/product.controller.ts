/**
 * ProductController - 产品控制器
 */

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: any) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.productService.findProducts(query);
  }

  @Get('stats')
  async getStats(@Query('id') id: string) {
    return this.productService.getProductStats(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findProductDetail(id);
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
