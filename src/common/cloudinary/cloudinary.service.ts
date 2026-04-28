import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly folder: string;

  constructor(
    @Inject(CLOUDINARY) private readonly _cld: typeof cloudinary,
    private readonly config: ConfigService,
  ) {
    this.folder = config.get<string>(
      'CLOUDINARY_FOLDER',
      'covoiturage/profiles',
    );
  }

  async uploadProfilePhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<CloudinaryUploadResult> {
    this.validateFile(file);

    const result = await this.uploadStream(file.buffer, {
      folder: this.folder,
      public_id: `user_${userId}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
    });

    this.logger.log(`Photo uploadée : ${result.public_id} (${result.bytes} octets)`);

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  async deletePhoto(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Photo supprimée : ${publicId}`);
    } catch (err) {
      this.logger.warn(`Impossible de supprimer la photo ${publicId} `);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format non supporté. Utilisez JPEG, PNG ou WebP.',
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 5 Mo).');
    }
  }

  private uploadStream(
    buffer: Buffer,
    options: Record<string, any>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException(
                `Cloudinary error: ${error.message}`,
              ),
            );
          }
          if (!result) {
            return reject(new BadRequestException('Upload échoué : aucune réponse Cloudinary.'));
          }
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  // Ajoutez cette méthode dans CloudinaryService, après uploadProfilePhoto()

async uploadVehiclePhoto(
  file: Express.Multer.File,
  vehicleId: string,
): Promise<CloudinaryUploadResult> {
  this.validateFile(file);

  const result = await this.uploadStream(file.buffer, {
    folder: 'covoiturage/vehicles',
    public_id: `vehicle_${vehicleId}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      {
        width: 800,
        height: 500,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
  });

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}
}
