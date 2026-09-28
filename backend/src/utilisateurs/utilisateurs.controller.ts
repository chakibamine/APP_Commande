import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { UpdateMeDto } from './dto/update-me.dto';
import { UtilisateursService } from './utilisateurs.service';

@ApiTags('utilisateurs')
@ApiBearerAuth()
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @Get('me')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: 'Profil du membre du personnel connecté' })
  me(@CurrentUser() user: AuthUser) {
    return this.utilisateursService.findMe(user.id);
  }

  @Patch('me')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE)
  @ApiOperation({ summary: 'Modifier son nom ou son mot de passe' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.utilisateursService.updateMe(user.id, dto);
  }
}
