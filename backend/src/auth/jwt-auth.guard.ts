import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyJwt, JwtPayload } from './jwt.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired authentication session token');
    }

    // Attach decoded user payload to request
    request.user = payload;
    return true;
  }
}
