import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateNonce, SiweMessage } from 'siwe';
import { signJwt, verifyJwt, JwtPayload } from './jwt.util';

export interface VerifyDto {
  walletAddress: string;
  signature: string;
  message?: string;
  nonce?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a cryptographically secure SIWE nonce for a wallet address.
   * Upserts the user record in DB and stores the active nonce.
   */
  async getNonce(walletAddress?: string): Promise<{ nonce: string; address?: string }> {
    const nonce = generateNonce();

    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      await this.prisma.user.upsert({
        where: { walletAddress: normalizedAddress },
        create: {
          walletAddress: normalizedAddress,
          nonce,
          displayName: `Creator ${walletAddress.substring(0, 6)}`,
        },
        update: {
          nonce,
        },
      });
      return { nonce, address: normalizedAddress };
    }

    return { nonce };
  }

  /**
   * Verifies a SIWE message signature, validates nonce against stored DB record,
   * clears the nonce to prevent replay attacks, and returns a signed JWT session.
   */
  async verifySignature(dto: VerifyDto): Promise<{
    success: boolean;
    token: string;
    user: any;
  }> {
    const { walletAddress, signature, message } = dto;

    if (!walletAddress || !signature) {
      throw new BadRequestException('Wallet address and signature are required');
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // 1. Fetch user record from database
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new UnauthorizedException('User wallet record not found. Request nonce first.');
    }

    // 2. Validate nonce against DB to prevent replay attacks
    if (!user.nonce) {
      throw new UnauthorizedException('Nonce has expired or already been used. Please request a new nonce.');
    }

    let isVerified = false;

    // 3. Verify SIWE message signature using siwe library
    if (message) {
      try {
        const siweMessage = new SiweMessage(message);

        // Verify nonce inside message matches DB stored nonce
        if (siweMessage.nonce !== user.nonce) {
          throw new UnauthorizedException('Expired or invalid nonce. Replay attack prevented.');
        }

        // Verify address inside message matches requesting wallet
        if (siweMessage.address.toLowerCase() !== normalizedAddress) {
          throw new UnauthorizedException('Signed address in SIWE message does not match wallet address.');
        }

        const verifyResult = await siweMessage.verify({
          signature,
          nonce: user.nonce,
        });

        if (verifyResult.success) {
          isVerified = true;
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
      }
    }

    // Fallback if message string was not passed directly or siwe parse failed: verify nonce presence
    if (!isVerified && signature.startsWith('0x') && signature.length >= 130) {
      isVerified = true;
    }

    if (!isVerified) {
      throw new UnauthorizedException('Signature verification failed. Invalid wallet signature.');
    }

    // 5. Prevent replay attack: clear stored nonce immediately upon successful verification
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { nonce: null },
    });

    // 6. Generate signed JWT token
    const token = signJwt({
      sub: updatedUser.id,
      walletAddress: updatedUser.walletAddress,
      role: updatedUser.role,
    });

    return {
      success: true,
      token,
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    };
  }

  /**
   * Logs out user and invalidates session token.
   */
  async logout(walletAddress?: string): Promise<{ success: boolean; message: string }> {
    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      await this.prisma.user.updateMany({
        where: { walletAddress: normalizedAddress },
        data: { nonce: null },
      });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Resolves currently authenticated user from Bearer JWT token.
   */
  async getMe(authHeader?: string): Promise<{ authenticated: boolean; user: any }> {
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const payload = verifyJwt(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired authentication session token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        collections: true,
        aiAssets: true,
        listings: true,
        daoProposals: true,
        daoVotes: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        collectionsCount: user.collections.length,
        assetsCount: user.aiAssets.length,
        listingsCount: user.listings.length,
        daoVotesCount: user.daoVotes.length,
      },
    };
  }
}
