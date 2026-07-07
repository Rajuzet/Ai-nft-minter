import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('Daily News & Magazine Update System')
@Controller()
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('api/news')
  @ApiOperation({ summary: 'Get published news articles' })
  async getNewsLegacy(@Query('category') category?: string, @Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.newsService.findAllNews(category, take);
  }

  @Get('api/v1/news')
  @ApiOperation({ summary: 'Get published news articles (v1)' })
  async getNews(@Query('category') category?: string, @Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.newsService.findAllNews(category, take);
  }

  @Get('api/news/latest')
  @ApiOperation({ summary: 'Get latest news articles' })
  async getLatestNewsLegacy(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 6;
    return this.newsService.findLatestNews(take);
  }

  @Get('api/v1/news/latest')
  @ApiOperation({ summary: 'Get latest news articles (v1)' })
  async getLatestNews(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 6;
    return this.newsService.findLatestNews(take);
  }

  @Get('api/news/category/:category')
  @ApiOperation({ summary: 'Get news articles by category' })
  async getByCategoryLegacy(@Param('category') category: string) {
    return this.newsService.findByCategory(category);
  }

  @Get('api/v1/news/category/:category')
  @ApiOperation({ summary: 'Get news articles by category (v1)' })
  async getByCategory(@Param('category') category: string) {
    return this.newsService.findByCategory(category);
  }

  @Get('api/magazine')
  @ApiOperation({ summary: 'Get long-form magazine articles' })
  async getMagazineLegacy(@Query('category') category?: string) {
    return this.newsService.findAllMagazine(category);
  }

  @Get('api/v1/magazine')
  @ApiOperation({ summary: 'Get long-form magazine articles (v1)' })
  async getMagazine(@Query('category') category?: string) {
    return this.newsService.findAllMagazine(category);
  }

  @Get('api/magazine/:slug')
  @ApiOperation({ summary: 'Get magazine article by slug' })
  async getMagazineBySlugLegacy(@Param('slug') slug: string) {
    const article = await this.newsService.findMagazineBySlug(slug);
    if (!article) throw new NotFoundException(`Magazine article '${slug}' not found`);
    return article;
  }

  @Get('api/v1/magazine/:slug')
  @ApiOperation({ summary: 'Get magazine article by slug (v1)' })
  async getMagazineBySlug(@Param('slug') slug: string) {
    const article = await this.newsService.findMagazineBySlug(slug);
    if (!article) throw new NotFoundException(`Magazine article '${slug}' not found`);
    return article;
  }

  @Post('api/news/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger RSS news feed synchronization' })
  async syncNewsLegacy() {
    const res = await this.newsService.syncNewsFeeds();
    return { success: true, ...res };
  }

  @Post('api/v1/news/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger RSS news feed synchronization (v1)' })
  async syncNews() {
    const res = await this.newsService.syncNewsFeeds();
    return { success: true, ...res };
  }
}
