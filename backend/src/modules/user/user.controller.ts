import {Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiConsumes} from '@nestjs/swagger';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {extname, join} from 'path';
import {mkdirSync} from 'fs';
import {UserService} from './user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponseDto} from './dto/user-response.dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar usuário', description: 'Cria um novo usuário no sistema' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuário criado', type: UserResponseDto })
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna lista paginada de usuários' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: ['USER', 'PROVIDER', 'ADMIN', 'MODERATOR'] })
  @ApiQuery({ name: 'search', required: false, example: 'joão' })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      role,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    };
    return this.userService.findAll(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes do usuário' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter usuário por slug' })
  @ApiParam({ name: 'slug', example: 'joao-silva' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.userService.findBySlug(slug);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Obter usuário por email' })
  @ApiParam({ name: 'email', example: 'joao@email.com' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário', description: 'Atualiza dados do usuário. Para trocar senha, enviar currentPassword + newPassword.' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  update(
    @Param('id') id: string, 
    @Body(ValidationPipe) updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover usuário', description: 'Soft delete: desativa e marca como deletado' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuário removido' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email', description: 'Marca o email como verificado' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email verificado' })
  verifyEmail(@Param('id') id: string) {
    return this.userService.verifyEmail(id);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar ativo/inativo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleActive(@Param('id') id: string) {
    return this.userService.toggleActive(id);
  }

  @Patch(':id/last-login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualizar último login' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  updateLastLogin(@Param('id') id: string) {
    return this.userService.updateLastLogin(id);
  }

  @Post(':id/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload foto de perfil' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar atualizado' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'images', 'users', 'profile-picture');
          mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${req.params.id}-${Date.now()}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Apenas imagens são aceitas (jpg, jpeg, png, gif, webp)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return this.userService.updateAvatar(id, file.filename);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estatísticas do usuário', description: 'Retorna contadores e métricas do usuário' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Estatísticas do usuário' })
  getStats(@Param('id') id: string) {
    return this.userService.getStats(id);
  }
}