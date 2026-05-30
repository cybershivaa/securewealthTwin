import { SecureApiClient } from '../api/secureApi';

export interface FraudPayload {
  user_id: string;
  device_id: string;
  session_id: string;
  risk_score: number;
  sms_text?: string;
  email_text?: string;
  voice_text?: string;
}

export class FraudService {
  constructor(private readonly client: SecureApiClient) {}

  async submitFraudPayload(payload: FraudPayload): Promise<{ status: string; request_id: string }> {
    return this.client.post('/secure/fraud-payload', payload);
  }

  async submitSmsFraud(payload: FraudPayload): Promise<{ status: string; request_id: string; channel: string; risk_score: number }> {
    return this.client.post('/fraud/sms', payload);
  }

  async submitEmailFraud(payload: FraudPayload): Promise<{ status: string; request_id: string; channel: string; risk_score: number }> {
    return this.client.post('/fraud/email', payload);
  }

  async submitVoiceFraud(payload: FraudPayload): Promise<{ status: string; request_id: string; channel: string; risk_score: number }> {
    return this.client.post('/fraud/voice', payload);
  }

  async submitSemanticFraud(payload: FraudPayload): Promise<{ status: string; request_id: string; channel: string; risk_score: number }> {
    return this.client.post('/fraud/semantic', payload);
  }

  async submitFeedback(payload: FraudPayload): Promise<{ status: string; request_id: string; channel: string; risk_score: number }> {
    return this.client.post('/fraud/feedback', payload);
  }

  async issueAccessToken(payload: { user_id: string; device_id: string; session_id: string }): Promise<{ access_token: string; token_type: string }> {
    return this.client.post('/secure/session/token', payload);
  }
}
