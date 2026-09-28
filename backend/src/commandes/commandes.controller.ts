import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TokenType } from '../common/enums/token-type.enum';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { ListCommandesQueryDto } from './dto/list-commandes-query.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';

@ApiTags('commandes')
@ApiBearerAuth()
@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post()
  @Roles(TokenType.CLIENT)
  @ApiOperation({ summary: 'Créer une commande' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCommandeDto) {
    return this.commandesService.create(user.id, dto);
  }

  @Get('mes-commandes')
  @Roles(TokenType.CLIENT)
  @ApiOperation({ summary: 'Historique des commandes du client' })
  mesCommandes(
    @CurrentUser() user: AuthUser,
    @Query() query: ListCommandesQueryDto,
  ) {
    return this.commandesService.findMesCommandes(user.id, query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: 'Liste de toutes les commandes' })
  findAll(@Query() query: ListCommandesQueryDto) {
    return this.commandesService.findAll(query);
  }

  @Get(':id')
  @Roles(TokenType.CLIENT, Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: "Détail d'une commande" })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commandesService.findOne(id, user);
  }

  @Patch(':id/statut')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: "Changer le statut d'une commande" })
  changerStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatutDto,
  ) {
    return this.commandesService.changerStatut(id, dto.statut);
  }
}
