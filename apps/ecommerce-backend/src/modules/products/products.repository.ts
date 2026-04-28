import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.schema';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,

        category: {
          connect: {
            id: dto.categoryId,
          },
        },

        images: dto.images
          ? {
              create: dto.images,
            }
          : undefined,

        variants: {
          create: dto.variants.map((variant) => ({
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,

            attributes: {
              create: variant.attributes.map((attr) => ({
                name: attr.name,
                value: attr.value,
              })),
            },
          })),
        },
      },

      include: {
        category: true,
        inventory: true,
        variants: {
          include: {
            attributes: true,
          },
        },
        images: true,
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  findByIdWithRelations(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        inventory: true,
      },
    });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
