import { Injectable } from '@nestjs/common';

export interface StatusResponse {
  welcomeMessage: string;
  apiKey: string;
  featureFlagBeta: boolean;
  betaFeatureState: string;
  readAt: string;
}

@Injectable()
export class AppService {
  getStatus(): StatusResponse {
    const rawApiKey = process.env.API_KEY ?? 'not-set';
    const maskedApiKey =
      rawApiKey.length > 4 ? `***${rawApiKey.slice(-4)}` : 'not-set';

    const featureFlagBeta = process.env.FEATURE_FLAG_BETA === 'true';

    return {
      welcomeMessage: process.env.WELCOME_MESSAGE ?? 'not-set',
      apiKey: maskedApiKey,
      featureFlagBeta,
      betaFeatureState: featureFlagBeta ? 'Beta features ON' : 'Beta features OFF',
      readAt: new Date().toISOString(),
    };
  }
}
