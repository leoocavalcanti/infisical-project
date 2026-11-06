import { Injectable } from '@nestjs/common';

export interface StatusResponse {
  welcomeMessage: string;
  apiKey: string;
  featureFlagBeta: boolean;
  userType: string;
}

@Injectable()
export class AppService {
  getStatus(): StatusResponse {
    const rawApiKey = process.env.API_KEY ?? 'Não configurado';
    const maskedApiKey =
      rawApiKey.length > 4 ? `***${rawApiKey.slice(-4)}` : 'Não configurado';

    const featureFlagBeta = process.env.FEATURE_FLAG_BETA === 'true';

    const flagAdmin = process.env.NODE_ENV === `dev`;
    let userType = `'Não configurado'`;

    if (process.env.NODE_ENV) {
      userType = flagAdmin ? `Você é administrador` : `Você é usuário`;
    }

    return {
      welcomeMessage: process.env.WELCOME_MESSAGE ?? 'Não configurado',
      apiKey: maskedApiKey,
      featureFlagBeta,
      userType,
    };
  }
}
