import { ApiProperty } from '@nestjs/swagger';
import { StatutCommande } from '../../common/enums/statut-commande.enum';
import { IsEnum } from 'class-validator';

export class UpdateStatutDto {
  @ApiProperty({ enum: StatutCommande })
  @IsEnum(StatutCommande)
  statut: StatutCommande;
}
