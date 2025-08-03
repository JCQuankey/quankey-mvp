// Extended WebAuthn type definitions for conditional UI support
interface PublicKeyCredential {
  isConditionalMediationAvailable?(): Promise<boolean>;
}

interface PublicKeyCredentialStatic {
  isConditionalMediationAvailable?(): Promise<boolean>;
}

declare global {
  interface Window {
    PublicKeyCredential: PublicKeyCredentialStatic & {
      new (): PublicKeyCredential;
      prototype: PublicKeyCredential;
      isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean>;
      isConditionalMediationAvailable?(): Promise<boolean>;
    };
  }
}

export {};