export interface CertificatePinningConfig {
  host: string;
  sha256Pins: string[];
}

export const securePinningConfig: CertificatePinningConfig = {
  host: 'securewealth.pnb.example',
  sha256Pins: ['REPLACE_WITH_PRODUCTION_CERTIFICATE_SHA256_PIN'],
};

export function isPinnedHost(host: string): boolean {
  return host === securePinningConfig.host;
}
