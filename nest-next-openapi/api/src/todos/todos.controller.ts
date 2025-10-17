// src/todos/todos.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { createZodDto } from 'nestjs-zod'
import * as TodoZod from '../../generated/zod/schemas/' // <-- after running `prisma generate`, adjust path/casing if necessary

const CreateSchema = TodoZod?.TodoCreateOneSchema
const ResponseSchema = TodoZod?.TodoCreateResultSchema

if (!CreateSchema || !ResponseSchema) {
  // If the generator exported different names, you'll need to open src/generated/zod/models/Todo.* and
  // pick the right export. This fallback avoids TS errors but you should replace with the exact names.
  // eslint-disable-next-line no-console
  console.warn(
    'Adjust imports: unable to reliably find Todo schemas in src/generated/zod/models/Todo.'
  )
}

// Create DTO classes from Zod
class TodoCreateDto extends createZodDto(
  (CreateSchema as any) ?? (TodoZod as any)
) {}
class TodoResponseDto extends createZodDto(
  (ResponseSchema as any) ?? (TodoZod as any)
) {}

@ApiTags('todos')
@Controller('todos')
export class TodosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiResponse({ status: 200, type: [TodoResponseDto] })
  async findAll(@Req() req) {
    const userId = req.user.id
    return this.prisma.todo.findMany({
      where: { ownerId: userId },
      orderBy: { created_at: 'desc' },
    })
  }

  @Post()
  @ApiBody({ type: TodoCreateDto })
  @ApiResponse({ status: 201, type: TodoResponseDto })
  async create(@Req() req, @Body() body: TodoCreateDto) {
    // body is already validated by nestjs-zod adapter (see next)
    const data = body as any
    const created = await this.prisma.todo.create({
      data: { ...data, ownerId: req.user.id },
    })
    return created
  }

  @Patch(':id')
  @ApiBody({ type: TodoCreateDto })
  @ApiResponse({ status: 200, type: TodoResponseDto })
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() body: Partial<TodoCreateDto>
  ) {
    const todo = await this.prisma.todo.findUnique({ where: { id } })
    if (!todo || todo.ownerId !== req.user.id) throw new NotFoundException()
    const updated = await this.prisma.todo.update({
      where: { id },
      data: body as any,
    })
    return updated
  }

  @Delete(':id')
  @ApiResponse({ status: 204 })
  async delete(@Req() req, @Param('id') id: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } })
    if (!todo || todo.ownerId !== req.user.id) throw new NotFoundException()
    await this.prisma.todo.delete({ where: { id } })
  }
}
