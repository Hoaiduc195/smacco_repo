import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpsertUserDto } from './dto/upsert-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const data: any = {
      firebaseUid: createUserDto.firebaseUid ?? `anon_${Date.now()}`,
      email: createUserDto.email,
      displayName: createUserDto.name,
      createdAt: undefined,
    };

    return this.prisma.user.create({ data });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async upsert(upsertUserDto: UpsertUserDto) {
    const { uid, email, name: displayName } = upsertUserDto;
    return this.prisma.user.upsert({
      where : {
        firebaseUid : uid
      },
      update : {
        email : email,
        displayName : displayName
      },
      create : {
        firebaseUid : uid,
        email : email,
        displayName : displayName
      }
    });
  }
}
