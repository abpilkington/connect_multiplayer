import bcrypt from 'bcrypt';
import type { IAccessControl } from '../types';

export class AccessControl implements IAccessControl {
  private readonly saltRounds: number;

  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  validateRoomCode(code: string): boolean {
    // Room codes should be 6-8 characters, alphanumeric (excluding confusing chars)
    const validPattern = /^[A-Z2-9]{6,8}$/;
    return validPattern.test(code);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  generateRoomCode(): string {
    // Use characters that are easy to read and type (no 0, 1, I, O, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Validate nickname (used for room joining)
  validateNickname(nickname: string): { valid: boolean; error?: string } {
    if (!nickname || nickname.trim().length === 0) {
      return { valid: false, error: 'Nickname cannot be empty' };
    }

    if (nickname.length > 20) {
      return { valid: false, error: 'Nickname too long (max 20 characters)' };
    }

    // Allow letters, numbers, spaces, and basic punctuation
    const validPattern = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validPattern.test(nickname)) {
      return { valid: false, error: 'Nickname contains invalid characters' };
    }

    return { valid: true };
  }

  // Sanitize nickname (remove extra whitespace, etc.)
  sanitizeNickname(nickname: string): string {
    return nickname.trim().replace(/\s+/g, ' ');
  }
}

