import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, ProviderStatus, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verificar se email já existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Verificar se slug já existe
    const existingSlug = await this.prisma.user.findUnique({
      where: { slug: createUserDto.slug }
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // Verificar se phone já existe (se fornecido)
    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: createUserDto.phone }
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        phone: createUserDto.phone,
        password: hashedPassword,
        name: createUserDto.name,
        slug: createUserDto.slug,
        avatarUrl: createUserDto.avatarUrl,
        cityId: createUserDto.cityId,
        role: createUserDto.role || UserRole.USER,
        isActive: createUserDto.isActive ?? true,
        receiveNewsletter: createUserDto.receiveNewsletter ?? false,
        receivePromotions: createUserDto.receivePromotions ?? false,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            state: true,
          },
        },
      },
    });

    // Remover senha do retorno
    const { password, ...result } = user;
    return result;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where,
        include: {
          city: {
            select: {
              id: true,
              name: true,
              slug: true,
              state: true,
            },
          },
          providerProfile: {
            select: {
              id: true,
              status: true,
              plan: true,
              averageRating: true,
              totalReviews: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Remover senhas dos resultados
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return {
      data: usersWithoutPassword,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            state: true,
          },
        },
        providerProfile: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        favoriteProviders: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          take: 10,
        },
        favoriteServices: {
          include: {
            service: true,
          },
          take: 10,
        },
        eventsSaved: {
          include: {
            event: true,
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            favoriteProviders: true,
            favoriteServices: true,
            eventsSaved: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Remover senha do retorno
    const { password, ...result } = user;
    return result;
  }

  async findBySlug(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      include: {
        city: true,
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with slug ${slug} not found`);
    }

    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verificar se email já está em uso por outro usuário
    if (updateUserDto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id },
        },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // Verificar se slug já está em uso por outro usuário
    if (updateUserDto.slug) {
      const slugExists = await this.prisma.user.findFirst({
        where: {
          slug: updateUserDto.slug,
          NOT: { id },
        },
      });

      if (slugExists) {
        throw new ConflictException('Slug already in use by another user');
      }
    }

    // Preparar dados para atualização
    const updateData: any = { ...updateUserDto };

    // Se estiver trocando a senha
    if (updateUserDto.newPassword) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      const isPasswordValid = await bcrypt.compare(
        updateUserDto.currentPassword,
        existingUser.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      updateData.password = await bcrypt.hash(updateUserDto.newPassword, 10);
      
      // Remover campos de senha do updateData para não tentar salvar como campos normais
      delete updateData.currentPassword;
      delete updateData.newPassword;
    }

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.createdAt;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            state: true,
          },
        },
        providerProfile: {
          select: {
            id: true,
            status: true,
            plan: true,
          },
        },
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async remove(id: string) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        providerProfile: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete - apenas marcar como deletado e inativo
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `${existingUser.email}.deleted.${Date.now()}`, // Liberar email para reuso
        slug: `${existingUser.slug}.deleted.${Date.now()}`, // Liberar slug para reuso
      },
    });

    // Se o usuário era provider, também desativar o perfil
    if (existingUser.providerProfile) {
      await this.prisma.provider.update({
        where: { userId: id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          status: ProviderStatus.SUSPENDED,
        },
      });
    }

    return {
      message: 'User successfully deleted',
      userId: user.id,
    };
  }

  async verifyEmail(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isEmailVerified: true },
    });

    const { password, ...result } = user;
    return result;
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async updateAvatar(id: string, filename: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Delete previous avatar file if it was a local upload
    if (user.avatarUrl) {
      const prevFilename = user.avatarUrl.split('/').pop();
      if (prevFilename) {
        const prevPath = join(process.cwd(), 'uploads', 'images', 'users', 'profile-picture', prevFilename);
        if (existsSync(prevPath)) {
          try { unlinkSync(prevPath); } catch {}
        }
      }
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const avatarUrl = `${baseUrl}/uploads/images/users/profile-picture/${filename}`;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });

    const { password, ...result } = updated;
    return result;
  }

  async getStats(id: string) {
    const stats = await this.prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            reviews: true,
            favoriteProviders: true,
            favoriteServices: true,
            eventsSaved: true,
            eventsCreated: true,
          },
        },
        providerProfile: {
          select: {
            viewsCount: true,
            totalReviews: true,
            averageRating: true,
            whatsappClicks: true,
            instagramClicks: true,
            websiteClicks: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return stats;
  }
}