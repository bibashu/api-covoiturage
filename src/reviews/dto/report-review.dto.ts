import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ReportReviewDto {
  @ApiProperty({ example: 'Commentaire injurieux.' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}