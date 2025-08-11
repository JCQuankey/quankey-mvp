/**
 * Generate Ed25519 keys for JWT
 */

const { generateKeyPairSync } = require('crypto');

// Generate Ed25519 key pair
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('JWT_PUBLIC_KEY:');
console.log(publicKey);
console.log('\nJWT_PRIVATE_KEY:');
console.log(privateKey);

// Also generate in base64 for easier .env usage
const pubKeyBase64 = publicKey.replace(/-----BEGIN PUBLIC KEY-----/, '')
  .replace(/-----END PUBLIC KEY-----/, '')
  .replace(/\n/g, '');
  
const privKeyBase64 = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '')
  .replace(/-----END PRIVATE KEY-----/, '')
  .replace(/\n/g, '');

console.log('\n\nFor .env file (base64):');
console.log(`JWT_PUBLIC_KEY="${pubKeyBase64}"`);
console.log(`JWT_PRIVATE_KEY="${privKeyBase64}"`);