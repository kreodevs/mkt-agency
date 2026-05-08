import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto, ApprovePostDto } from './dto/create-post.dto';

@Controller('tenants/:tenantId/posts')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(tenantId, null as any, dto);
  }

  @Post('product/:productId')
  createForProduct(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(tenantId, productId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query('productId') productId?: string) {
    return this.postsService.findAll(tenantId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApprovePostDto) {
    return this.postsService.approve(id, dto);
  }

  @Post(':id/v2')
  createNextVersion(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.postsService.createNextVersion(id, dto);
  }
}