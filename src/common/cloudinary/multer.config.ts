import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const multerConfig = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Format non supporté. Utilisez JPEG, PNG ou WebP.',
        ),
        false,
      );
    }
  },
};
