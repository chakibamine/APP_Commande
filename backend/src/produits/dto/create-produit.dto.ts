import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CategorieProduit } from '../../common/enums/categorie-produit.enum';

export class CreateProduitDto {
  @ApiProperty({ example: 'Gasoil' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'litre' })
  @IsString()
  @IsNotEmpty()
  unite: string;

  @ApiPropertyOptional({
    enum: CategorieProduit,
    default: CategorieProduit.AUTRE,
  })
  @IsOptional()
  @IsIn(Object.values(CategorieProduit))
  categorie?: CategorieProduit;

  @ApiProperty({ example: 12.5, description: 'Prix en dirhams (DH)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  prixUnitaire: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}
