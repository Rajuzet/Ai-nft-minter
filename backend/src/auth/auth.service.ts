import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateNonce, SiweMessage } from 'siwe';
import { signJwt, verifyJwt } from './jwt.util';
import * as crypto from 'crypto';

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
   * Stores the nonce hash in the DB with a 5-minute expiration.
   */
  async getNonce(walletAddress?: string, domain?: string): Promise<{ nonce: string; address?: string }> {
    const nonce = generateNonce();
    const nonceHash = crypto.createHash('sha256').update(nonce).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    const resolvedDomain = domain || 'localhost:3000';

    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();

      // Upsert the user to ensure a profile exists
      await this.prisma.user.upsert({
        where: { walletAddress: normalizedAddress },
        create: {
          walletAddress: normalizedAddress,
          displayName: `Creator ${walletAddress.substring(0, 6)}`,
          role: 'CREATOR',
        },
        update: {},
      });

      // Save the nonce hash and metadata in the database
      await this.prisma.authenticationNonce.create({
        data: {
          walletAddress,
          normalizedWallet: normalizedAddress,
          nonceHash,
          domain: resolvedDomain,
          expiresAt,
        },
      });

      return { nonce, address: normalizedAddress };
    }

    return { nonce };
  }

  /**
   * Verifies a SIWE message signature, validates nonce against stored DB record,
   * consumes the nonce, and registers a database-backed session.
   */
  async verifySignature(dto: VerifyDto): Promise<{
    success: boolean;
    token: string;
    user: any;
  }> {
    const { walletAddress, signature, message } = dto;

    if (!walletAddress || !signature || !message) {
      throw new BadRequestException('Wallet address, signature, and SIWE message are required');
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // 1. Parse the SIWE message
    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage(message);
    } catch (err) {
      throw new BadRequestException('Invalid SIWE message format.');
    }

    // 2. Fetch the nonce record from the DB using its hash
    const nonceHash = crypto.createHash('sha256').update(siweMessage.nonce).digest('hex');
    const nonceRecord = await this.prisma.authenticationNonce.findUnique({
      where: { nonceHash },
    });

    if (!nonceRecord) {
      throw new UnauthorizedException('Authentication nonce not found.');
    }

    // 3. Validate nonce constraints (expiration, usage)
    if (nonceRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Nonce has expired. Please request a new nonce.');
    }

    if (nonceRecord.consumedAt) {
      throw new UnauthorizedException('Nonce has already been consumed. Replay attack prevented.');
    }

    // 4. Validate domain and address matches
    if (siweMessage.address.toLowerCase() !== normalizedAddress) {
      throw new UnauthorizedException('Signed address in SIWE message does not match requesting wallet address.');
    }

    // 5. Cryptographically verify signature
    try {
      const verifyResult = await siweMessage.verify({
        signature,
        nonce: siweMessage.nonce,
        domain: nonceRecord.domain,
      });

      if (!verifyResult.success) {
        throw new UnauthorizedException('Signature verification failed.');
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(`SIWE cryptographic verification error: ${err.message}`);
    }

    // 6. Mark nonce as consumed (atomic-like update)
    await this.prisma.authenticationNonce.update({
      where: { id: nonceRecord.id },
      data: { consumedAt: new Date() },
    });

    // 7. Fetch user and create database-backed session
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

    await this.prisma.session.create({
      data: {
        sessionToken: sessionTokenHash,
        userId: user.id,
        expiresAt: sessionExpiresAt,
      },
    });

    // 8. Generate JWT token with session token embedded as jti
    const token = signJwt({
      sub: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      jti: sessionToken,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Logs out user by revoking the active session associated with the token.
   */
  async logout(token?: string): Promise<{ success: boolean; message: string }> {
    if (token) {
      const payload = verifyJwt(token);
      if (payload && payload.jti) {
        const sessionTokenHash = crypto.createHash('sha256').update(payload.jti).digest('hex');
        await this.prisma.safe(() =>
          this.prisma.session.updateMany({
            where: { sessionToken: sessionTokenHash },
            data: { revokedAt: new Date() },
          }),
        );
      }
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Revokes all active sessions for a user.
   */
  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true, message: 'All active sessions revoked successfully' };
  }

  /**
   * Resolves currently authenticated user from Bearer JWT token and verifies the DB session state.
   */
  async getMe(authHeader?: string): Promise<{ authenticated: boolean; user: any }> {
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const payload = verifyJwt(token);

    if (!payload || !payload.jti) {
      throw new UnauthorizedException('Invalid or expired authentication session token');
    }

    // Verify session state in DB
    const sessionTokenHash = crypto.createHash('sha256').update(payload.jti).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: sessionTokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has been revoked or expired.');
    }

    // Refresh last activity timestamp asynchronously
    this.prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    }).catch(() => {});

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
