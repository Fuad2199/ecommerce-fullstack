import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);

    if (parsed.success) return parsed.data;

    // map error messages
    // const errors = parsed.error.issues.map((i) => ({
    //   path: i.path.join('.') || '(root)',
    //   message: i.message,
    // }));

    throw new BadRequestException({
      message: `Validation failed for ${metadata.type}`,
      errors: parsed.error.issues,
    });
  }
}
