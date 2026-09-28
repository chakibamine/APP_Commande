import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TokenType } from '../common/enums/token-type.enum';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { ProduitsService } from './produits.service';

@ApiTags('produits')
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des produits disponibles' })
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user?: AuthUser) {
    const includeUnavailable = user?.type === TokenType.STAFF;
    return this.produitsService.findAll(query, includeUnavailable);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: "Détail d'un produit" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.produitsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un produit' })
  create(@Body() dto: CreateProduitDto) {
    return this.produitsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un produit' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProduitDto,
  ) {
    return this.produitsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer un produit, ou le désactiver s’il a déjà été commandé',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.produitsService.remove(id);
  }
}
