import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginClientDto {
  @ApiProperty({ example: '0612345678' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motDePasse: string;
}
