import { Injectable } from '@nestjs/common';

export interface StatusResponse {
  welcomeMessage: string;
  apiKey: string;
  featureFlagBeta: boolean;
  isAdmin: string | null;
}

@Injectable()
export class AppService {
  getStatus(): StatusResponse {
    const rawApiKey = process.env.API_KEY ?? 'not-set';
    const maskedApiKey =
      rawApiKey.length > 4 ? `***${rawApiKey.slice(-4)}` : 'not-set';

    const featureFlagBeta = process.env.FEATURE_FLAG_BETA === 'true';

    const flagAdmin = process.env.NODE_ENV;

    const userType = flagAdmin ? `Você é administrador` : `Você é usuário`;

    return {
      welcomeMessage: process.env.WELCOME_MESSAGE ?? 'not-set',
      apiKey: maskedApiKey,
      featureFlagBeta,
      isAdmin: flagAdmin ? userType : null,
    };
  }
}
