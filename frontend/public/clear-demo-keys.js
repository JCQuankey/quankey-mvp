// 🚀 Script para limpiar claves demo y forzar generación ML-KEM-768 real
console.log('🧹 Cleaning demo keys and forcing real ML-KEM-768 generation...');

// Remove old demo keys
localStorage.removeItem('vault_public_key');
localStorage.removeItem('quantum_vault_public');
localStorage.removeItem('quantum_vault_public_key');

// Remove any demo key values
Object.keys(localStorage).forEach(key => {
  const value = localStorage.getItem(key);
  if (value === 'quantum-public-key-base64-demo') {
    console.log('🗑️ Removing demo key:', key);
    localStorage.removeItem(key);
  }
});

// Clear session storage
sessionStorage.removeItem('vault_secret_key');
sessionStorage.removeItem('quantum_vault_secret');
sessionStorage.removeItem('quantum_vault_secret_key');

console.log('✅ Demo keys cleared. Reload page to generate real ML-KEM-768 keys.');
console.log('📝 Next password save will use REAL 1184-byte quantum keys.');