/**
 * ===============================================================================
 * 🔧 BIGINT SERIALIZATION UTILITIES
 * ===============================================================================
 * 
 * PROBLEM: WebAuthn credential responses contain BigInt values that cannot be 
 * serialized to JSON, causing "TypeError: Do not know how to serialize a BigInt"
 * 
 * SOLUTION: Convert BigInt to string before JSON.stringify operations
 * 
 * PATENT-CRITICAL: Ensures WebAuthn biometric authentication works in production
 */

export function serializeBigInt(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export function replaceBigIntInObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceBigIntInObject(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceBigIntInObject(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Safely serialize WebAuthn response data
 * Handles common BigInt fields from Prisma models and WebAuthn responses
 */
export function serializeWebAuthnResponse(data: any): any {
  // Handle common Prisma BigInt fields
  if (data && typeof data === 'object') {
    const cleaned = { ...data };
    
    // Convert common BigInt fields
    if (cleaned.counter && typeof cleaned.counter === 'bigint') {
      cleaned.counter = cleaned.counter.toString();
    }
    
    // Convert dates to ISO strings
    if (cleaned.createdAt instanceof Date) {
      cleaned.createdAt = cleaned.createdAt.toISOString();
    }
    
    if (cleaned.updatedAt instanceof Date) {
      cleaned.updatedAt = cleaned.updatedAt.toISOString();
    }
    
    // Recursively clean nested objects
    return replaceBigIntInObject(cleaned);
  }
  
  return replaceBigIntInObject(data);
}

/**
 * Create a safe user response object without BigInt fields
 */
export function createSafeUserResponse(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    biometricEnabled: user.biometricEnabled,
    webauthnId: user.webauthnId,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    // Convert counter from BigInt to string if present
    counter: user.counter ? user.counter.toString() : '0'
  };
}