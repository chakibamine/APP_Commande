import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterClientDto {
  @ApiProperty({ example: 'Station Atlas' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: '0612345678' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiPropertyOptional({ example: 'atlas@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '12 rue des Oliviers, Casablanca' })
  @IsString()
  @IsNotEmpty()
  adresse: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  motDePasse: string;
}
