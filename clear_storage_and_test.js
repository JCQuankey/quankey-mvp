// 🧹 SCRIPT PARA LIMPIAR STORAGE Y PROBAR AUTENTICACIÓN
// Ejecutar en la consola del navegador (F12) en https://quankey.xyz

const clearAndTest = () => {
  console.log('🧹 === LIMPIANDO STORAGE Y PROBANDO AUTENTICACIÓN ===\n');
  
  // 1. Limpiar todo el localStorage relacionado con tokens
  console.log('1️⃣ LIMPIANDO TOKENS ANTIGUOS:');
  const oldKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('token') || key.includes('auth') || key.includes('user'))) {
      oldKeys.push(key);
    }
  }
  
  oldKeys.forEach(key => {
    console.log(`   🗑️ Eliminando: ${key}`);
    localStorage.removeItem(key);
  });
  
  // También limpiar sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('token') || key.includes('auth') || key.includes('user'))) {
      console.log(`   🗑️ Eliminando sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    }
  }
  
  console.log('   ✅ Storage limpio\n');
  
  // 2. Verificar estado actual
  console.log('2️⃣ VERIFICANDO ESTADO ACTUAL:');
  console.log('   📋 localStorage keys:', Object.keys(localStorage));
  console.log('   📋 sessionStorage keys:', Object.keys(sessionStorage));
  
  // 3. Verificar endpoints disponibles
  console.log('\n3️⃣ ENDPOINTS DISPONIBLES:');
  console.log('   📝 Registro: /api/auth/register/begin → /api/auth/register/finish');
  console.log('   🔐 Login: /api/auth/login/begin → /api/auth/login/finish');
  console.log('   🗂️ Vault: /api/vault/items (requiere auth_token)');
  
  // 4. Instrucciones para el usuario
  console.log('\n4️⃣ PRÓXIMOS PASOS:');
  console.log('   1. Recarga la página (Ctrl+F5)');
  console.log('   2. Intenta crear un nuevo usuario');
  console.log('   3. El sistema debe guardar el token como "auth_token"');
  console.log('   4. Intenta guardar una contraseña');
  console.log('   5. Verifica que aparezca en el vault');
  
  console.log('\n🔍 DEBUGGING:');
  console.log('   - Si el registro falla: revisa console del navegador');
  console.log('   - Si el token no se guarda: verifica authService.ts');
  console.log('   - Si el vault no carga: verifica vaultService.ts');
  console.log('   - Si hay 401: verifica que el token esté en Authorization header');
  
  console.log('\n🧹 === LIMPIEZA COMPLETA ===');
};

// Función para verificar el token después del registro/login
const checkTokenStatus = () => {
  console.log('🔍 === VERIFICANDO STATUS DEL TOKEN ===');
  
  const authToken = localStorage.getItem('auth_token');
  const oldToken = localStorage.getItem('token');
  
  console.log('📋 Token status:');
  console.log('   auth_token (correcto):', authToken ? `✅ ${authToken.substring(0, 20)}...` : '❌ No encontrado');
  console.log('   token (incorrecto):', oldToken ? `⚠️ ${oldToken.substring(0, 20)}...` : '✅ No existe');
  
  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      console.log('📝 Token payload:', {
        userId: payload.userId,
        username: payload.username,
        authMethod: payload.authMethod,
        exp: new Date(payload.exp * 1000)
      });
    } catch (e) {
      console.error('❌ Error decodificando token:', e);
    }
  }
  
  if (oldToken && !authToken) {
    console.log('🔄 MIGRATING: Moviendo token viejo a auth_token');
    localStorage.setItem('auth_token', oldToken);
    localStorage.removeItem('token');
  }
  
  console.log('🔍 === VERIFICACIÓN COMPLETA ===');
};

// Auto ejecutar
console.log('🔧 SCRIPT DE LIMPIEZA Y TEST CARGADO');
console.log('📝 Ejecuta: clearAndTest() para limpiar storage');
console.log('🔍 Ejecuta: checkTokenStatus() para verificar token después del login');

clearAndTest();