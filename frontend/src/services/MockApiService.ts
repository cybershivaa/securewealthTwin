/**
 * Mock API service that simulates backend communication.
 * In a real app, this would make HTTP requests to a backend server
 * or use Firebase Authentication for user login.
 */
export class MockApiService {
  /**
   * Simulates user login.
   * Returns true if credentials match the mock data.
   * Accepts any non-empty email/password for demo purposes.
   */
  static async login(email: string, password: string): Promise<boolean> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Accept any non-empty credentials for demo
    if (email.length > 0 && password.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Simulates Google Sign-In.
   * Always returns true after a simulated delay.
   */
  static async googleSignIn(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return true;
  }

  /**
   * Simulates submitting a payment risk check to a backend.
   * Returns a mock response map with verification status.
   */
  static async verifyPayment(
    amount: number,
    riskScore: number
  ): Promise<{ verified: boolean; message: string; timestamp: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      verified: riskScore <= 70,
      message:
        riskScore <= 30
          ? 'Payment approved – low risk transaction'
          : riskScore <= 70
          ? 'Payment approved with additional verification'
          : 'Payment blocked – high risk detected',
      timestamp: new Date().toISOString(),
    };
  }
}
