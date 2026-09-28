import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutCommande } from '../../common/enums/statut-commande.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListCommandesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StatutCommande })
  @IsOptional()
  @IsEnum(StatutCommande)
  statut?: StatutCommande;
}
