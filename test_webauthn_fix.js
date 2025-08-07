// 🔧 SCRIPT PARA PROBAR FIX DE WEBAUTHN
// Ejecutar en la consola del navegador (F12) en https://quankey.xyz

const testWebAuthnFix = async () => {
  console.log('🔧 === PROBANDO FIX DE WEBAUTHN ===\n');
  
  try {
    // 1. Verificar soporte WebAuthn
    console.log('1️⃣ VERIFICANDO SOPORTE WEBAUTHN:');
    if (!window.PublicKeyCredential) {
      console.error('❌ WebAuthn no soportado en este navegador');
      return;
    }
    
    const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('   ✅ WebAuthn soportado');
    console.log('   📱 Platform authenticator:', platformAvailable ? 'Disponible' : 'No disponible');
    
    // 2. Probar obtener opciones de registro
    console.log('\n2️⃣ PROBANDO OPCIONES DE REGISTRO:');
    try {
      const regResponse = await fetch('https://api.quankey.xyz/api/auth/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'test_webauthn_' + Date.now(),
          displayName: 'Test User WebAuthn Fix'
        })
      });
      
      const regData = await regResponse.json();
      console.log('   📝 Registro response:', regData.success ? '✅ OK' : '❌ Error');
      
      if (regData.success && regData.options) {
        console.log('   🔍 Extensions en registro:', regData.options.extensions);
        
        // Verificar que no tenga largeBlob con support
        if (regData.options.extensions?.largeBlob?.support) {
          console.warn('   ⚠️ ADVERTENCIA: largeBlob.support encontrado en registro (puede estar OK)');
        } else {
          console.log('   ✅ Registro: Sin largeBlob.support problemático');
        }
      }
    } catch (error) {
      console.error('   ❌ Error probando registro:', error);
    }
    
    // 3. Probar obtener opciones de login
    console.log('\n3️⃣ PROBANDO OPCIONES DE LOGIN:');
    try {
      const loginResponse = await fetch('https://api.quankey.xyz/api/auth/login/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'test_user_login'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('   🔐 Login response:', loginData.success ? '✅ OK' : '❌ Error');
      
      if (loginData.success && loginData.options) {
        console.log('   🔍 Extensions en login:', loginData.options.extensions);
        
        // Verificar que NO tenga largeBlob con support (esto causa el error)
        if (loginData.options.extensions?.largeBlob?.support) {
          console.error('   🚨 ERROR ENCONTRADO: largeBlob.support en LOGIN - esto causa el error!');
          console.error('   🔧 FIX NECESARIO: Eliminar largeBlob.support del generateAuthenticationOptions');
        } else {
          console.log('   ✅ Login: Sin largeBlob.support problemático - FIX APLICADO');
        }
      }
    } catch (error) {
      console.error('   ❌ Error probando login:', error);
    }
    
    // 4. Resumen del diagnóstico
    console.log('\n4️⃣ RESUMEN DEL DIAGNÓSTICO:');
    console.log('   🔧 Fix aplicado: largeBlob.support eliminado del login');
    console.log('   📋 Próximo paso: Probar registro y login reales');
    console.log('   🚨 Si aún hay error: Verificar otros servicios WebAuthn');
    
    // 5. Instrucciones para prueba real
    console.log('\n5️⃣ CÓMO PROBAR EL FIX:');
    console.log('   1. Limpia localStorage: clearAndTest()');
    console.log('   2. Recarga la página');
    console.log('   3. Intenta crear un nuevo usuario');
    console.log('   4. NO debería aparecer el error de largeBlob');
    console.log('   5. Si aparece, ejecuta este script para más detalles');
    
  } catch (error) {
    console.error('❌ Error en prueba WebAuthn:', error);
  }
  
  console.log('\n🔧 === PRUEBA WEBAUTHN COMPLETA ===');
};

// Función específica para probar solo el login
const testLoginOnly = async () => {
  console.log('🔐 Probando solo opciones de login...');
  
  try {
    const response = await fetch('https://api.quankey.xyz/api/auth/login/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test' })
    });
    
    const data = await response.json();
    
    if (data.success && data.options?.extensions?.largeBlob?.support) {
      console.error('🚨 PROBLEMA PERSISTE: largeBlob.support en login');
      console.log('📋 Extensions completas:', data.options.extensions);
    } else {
      console.log('✅ FIX CORRECTO: No hay largeBlob.support en login');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('🔧 SCRIPT DE PRUEBA WEBAUTHN CARGADO');
console.log('📝 Ejecuta: testWebAuthnFix() para prueba completa');
console.log('🔐 Ejecuta: testLoginOnly() para probar solo el login');

// Auto ejecutar prueba de login
testLoginOnly();