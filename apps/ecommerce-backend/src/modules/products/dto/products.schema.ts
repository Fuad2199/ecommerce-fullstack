import z from 'zod';

export const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  order: z.number().int().optional(),
});

export const VariantAttributeSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

export const ProductVariantSchema = z.object({
  sku: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().positive().nonnegative(),

  attributes: z.array(VariantAttributeSchema).min(1),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  images: z.array(ProductImageSchema).optional(),
  variants: z.array(ProductVariantSchema).min(1),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  sku: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
