import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateEmailDto, UpdatePasswordDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { User, UserRole } from './entities/user.entity';
import { multerConfig } from '../common/cloudinary/multer.config';

@ApiTags('users')
@ApiAuthRequired()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── READ ─────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lister tous les utilisateurs avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findOne(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Statistiques de l\'utilisateur connecté' })
  getMyStats(@CurrentUser() user: User) {
    return this.usersService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Profil public d\'un utilisateur' })
  @ApiParam({ name: 'id', type: String, description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques publiques d\'un utilisateur' })
  @ApiParam({ name: 'id', type: String })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getStats(id);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour son propre profil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateMe(
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.id, dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Patch('me/email')
  @ApiOperation({ summary: 'Changer son adresse email (mot de passe requis)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateEmail(
    @Body() dto: UpdateEmailDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.usersService.updateEmail(user.id, dto, user.id);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Changer son mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  updatePassword(
    @Body() dto: UpdatePasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.updatePassword(user.id, dto, user.id);
  }

  // ─── PHOTO ────────────────────────────────────────────────────────────────

  @Post('me/photo')
  @ApiOperation({ summary: 'Uploader / remplacer sa photo de profil (Cloudinary)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image JPEG, PNG ou WebP — max 5 Mo',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou trop volumineux' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadMyPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.usersService.uploadProfilePhoto(user.id, file, user.id);
  }

  @Post(':id/photo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Uploader la photo d\'un utilisateur' })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    return this.usersService.uploadProfilePhoto(id, file, currentUser.id);
  }

  @Delete('me/photo')
  @ApiOperation({ summary: 'Supprimer sa photo de profil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  deleteMyPhoto(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.deleteProfilePhoto(user.id, user.id);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver son compte (soft delete)' })
  @ApiResponse({ status: 204 })
  removeMe(@CurrentUser() user: User): Promise<void> {
    return this.usersService.remove(user.id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Désactiver un compte' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.usersService.remove(id, currentUser.id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Supprimer définitivement un compte et sa photo Cloudinary' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.hardDelete(id);
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Vérifier / valider un utilisateur' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponseDto })
  verify(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.verify(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Réactiver un compte désactivé' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponseDto })
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.restore(id);
  }
}
