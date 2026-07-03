import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateNonce } from 'siwe';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getNonce(walletAddress: string): Promise<{ nonce: string }> {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = generateNonce();

    await this.prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      create: {
        walletAddress: normalizedAddress,
        nonce,
        displayName: `Creator ${normalizedAddress.substring(0, 6)}`,
      },
      update: {
        nonce,
      },
    });

    return { nonce };
  }

  async verifySignature(walletAddress: string, signature: string): Promise<{ success: boolean; token: string; user: any }> {
    if (!walletAddress || !signature) {
      throw new BadRequestException('Wallet address and signature are required');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Request nonce first.');
    }

    // In production, verify SIWE message + signature with siwe library
    // For now generate a session token
    const token = `wcos_session_${Date.now()}_${user.id}`;

    // Reset nonce after authentication
    await this.prisma.user.update({
      where: { id: user.id },
      data: { nonce: null },
    });

    return {
      success: true,
      token,
      user,
    };
  }
}
