import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class LigneCommandeInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  produitId: string;

  @ApiProperty({ example: 200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  quantite: number;
}

export class CreateCommandeDto {
  @ApiProperty({ type: [LigneCommandeInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeInputDto)
  lignes: LigneCommandeInputDto[];
}
