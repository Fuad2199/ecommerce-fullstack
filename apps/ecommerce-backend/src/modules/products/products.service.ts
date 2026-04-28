import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto } from './dto/products.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private repo: ProductsRepository) {}

  async create(dto: CreateProductDto) {
    if (!dto.variants?.length) {
      throw new BadRequestException('Product must have at least one variant');
    }

    try {
      return await this.repo.create(dto);
    } catch (error: unknown) {
      // Prisma known errors handle etmək üçün
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }

      throw error; // fallback → 500
    }
  }

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  update(id: string, dto: UpdateProductDto) {
    if (!Object.keys(dto).length) {
      throw new BadRequestException('Empty update payload');
    }

    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.repo.delete(id);
  }
}
