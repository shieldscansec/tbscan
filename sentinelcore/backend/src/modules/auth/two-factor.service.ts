import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(private readonly configService: ConfigService) {}

  generateSecret(): string {
    const secret = speakeasy.generateSecret({
      name: 'SentinelCore',
      issuer: 'Shield Scan Security',
      length: 32,
    });

    return secret.base32;
  }

  async generateQRCode(email: string, secret: string): Promise<string> {
    const appName = this.configService.get('auth.twoFactorAppName', 'SentinelCore');
    const issuer = 'Shield Scan Security';

    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: encodeURIComponent(`${appName}:${email}`),
      issuer: encodeURIComponent(issuer),
      encoding: 'base32',
    });

    return await QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps before and after current time
    });
  }

  verifyBackupCode(backupCodes: string[], code: string): boolean {
    const index = backupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      return true;
    }
    return false;
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}