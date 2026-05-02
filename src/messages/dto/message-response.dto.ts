import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { MessageType } from '../entities/message.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Exclude()
export class MessageResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() bookingId!: string;
  @Expose() @ApiProperty() content!: string;
  @Expose() @ApiProperty({ enum: MessageType }) type!: MessageType;
  @Expose() @ApiProperty() isRead!: boolean;
  @Expose() @ApiProperty() readAt!: Date;
  @Expose() @ApiProperty() createdAt!: Date;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  sender!: UserResponseDto;
}