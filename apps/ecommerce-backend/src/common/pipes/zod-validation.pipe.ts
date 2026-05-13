import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const formatted = result.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new BadRequestException({
        message: `Validation failed for ${metadata.type}`,
        errors: formatted,
      });
    }
    return result.data;
  }
}
