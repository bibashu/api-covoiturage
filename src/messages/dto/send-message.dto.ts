import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'uuid-de-la-reservation' })
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ example: 'Je serai là dans 5 minutes.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

// DTO WebSocket (sans bookingId — passé dans la room)
export class WsSendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}