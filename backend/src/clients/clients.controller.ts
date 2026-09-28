import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums/role.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TokenType } from '../common/enums/token-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('me')
  @Roles(TokenType.CLIENT)
  @ApiOperation({ summary: 'Profil du client connecté' })
  me(@CurrentUser() user: AuthUser) {
    return this.clientsService.findOne(user.id);
  }

  @Patch('me')
  @Roles(TokenType.CLIENT)
  @ApiOperation({ summary: 'Modifier son profil' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: 'Liste de tous les clients' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: "Détail d'un client" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }
}
