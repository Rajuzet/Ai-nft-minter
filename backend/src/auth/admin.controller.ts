import { Controller, Get, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Admin Operations')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('audit-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Retrieve system audit logs (Admin only)' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'List of system audit logs' })
  async getAuditLogs(@Req() req: any, @Ip() ipAddress: string) {
    // 1. Fetch all audit logs
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
          },
        },
      },
    });

    // 2. Log this admin action to audit logs
    await this.prisma.auditLog.create({
      data: {
        userId: req.user.sub,
        action: 'ADMIN_VIEW_AUDIT_LOGS',
        ipAddress,
        details: JSON.stringify({ count: logs.length }),
      },
    });

    return {
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        user: log.user,
      })),
    };
  }
}
