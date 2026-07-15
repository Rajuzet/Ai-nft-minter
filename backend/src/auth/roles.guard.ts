import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied. No role profile found for this session.');
    }

    const hasRole = requiredRoles.some((role) => user.role.toUpperCase() === role.toUpperCase());
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Action requires one of these roles: [${requiredRoles.join(', ')}]. Current role: ${user.role}`);
    }

    return true;
  }
}
