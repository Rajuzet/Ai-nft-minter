import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyJwt } from './jwt.util';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authentication token missing from Authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization token format');
    }

    const payload = verifyJwt(token);
    if (!payload || !payload.jti) {
      throw new UnauthorizedException('Invalid or expired authentication session token');
    }

    // Verify session in the database
    const sessionTokenHash = crypto.createHash('sha256').update(payload.jti).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: sessionTokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Authentication session has been revoked or has expired.');
    }

    if (!session.user || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is suspended or no longer exists.');
    }

    // Attach decoded user payload to request
    request.user = {
      sub: session.user.id,
      walletAddress: session.user.walletAddress,
      role: session.user.role,
    };

    return true;
  }
}
