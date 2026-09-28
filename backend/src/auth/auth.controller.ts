import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterClientDto } from './dto/register-client.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-client')
  @ApiOperation({ summary: 'Inscription client' })
  registerClient(@Body() dto: RegisterClientDto) {
    return this.authService.registerClient(dto);
  }

  @Public()
  @Post('login-client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion client' })
  loginClient(@Body() dto: LoginClientDto) {
    return this.authService.loginClient(dto);
  }

  @Public()
  @Post('login-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion administrateur ou gestionnaire' })
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto);
  }
}
