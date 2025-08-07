// 🔴 VAULT DEBUG SCRIPT - Ejecutar en consola del navegador
// Este script hace debug completo del problema de persistencia

const fullVaultDebug = async () => {
  console.log('🔴 === INICIANDO DEBUGGING COMPLETO DEL VAULT ===\n');
  
  try {
    // 1. Verificar tokens y IDs
    console.log('1️⃣ VERIFICANDO AUTENTICACIÓN:');
    const token = localStorage.getItem('auth_token');
    const storedId = localStorage.getItem('user_id');
    
    if (!token) {
      console.error('❌ NO HAY TOKEN DE AUTENTICACIÓN');
      return;
    }
    
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const tokenUserId = tokenData.userId;
    
    console.log('   📋 localStorage user_id:', storedId);
    console.log('   🎫 JWT token userId:', tokenUserId);
    console.log('   🔍 Token data:', tokenData);
    console.log('   ✅ IDs match?', storedId === tokenUserId ? 'SÍ' : 'NO\n');
    
    // 2. Llamar al endpoint de debug
    console.log('2️⃣ CONSULTANDO ENDPOINT DE DEBUG:');
    const debugRes = await fetch('https://api.quankey.xyz/api/vault/debug', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!debugRes.ok) {
      console.error('❌ Error al consultar debug endpoint:', debugRes.status, debugRes.statusText);
      return;
    }
    
    const debugData = await debugRes.json();
    console.log('   📊 Debug data:', debugData);
    
    // 3. Intentar guardar un item de prueba
    console.log('\n3️⃣ GUARDANDO ITEM DE PRUEBA:');
    const testItem = {
      userId: tokenUserId,
      vaultId: 'debug_test_' + Date.now(),
      title: 'TEST_DEBUG_' + new Date().toISOString(),
      username: 'debug_user',
      password: 'debug_password_123',
      url: 'https://debug.test',
      notes: 'Item de prueba para debug',
      vaultPublicKey: localStorage.getItem('quantum_vault_public') || 'test_key_' + Date.now()
    };
    
    console.log('   📝 Item a guardar:', testItem);
    
    const saveRes = await fetch('https://api.quankey.xyz/api/vault/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testItem)
    });
    
    const saveResult = await saveRes.json();
    console.log('   📤 Resultado del save:', {
      status: saveRes.status,
      success: saveResult.success,
      data: saveResult
    });
    
    // 4. Verificar inmediatamente después del save
    console.log('\n4️⃣ VERIFICANDO INMEDIATAMENTE DESPUÉS DEL SAVE:');
    const verifyRes = await fetch(`https://api.quankey.xyz/api/vault/items/${tokenUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const verifyResult = await verifyRes.json();
    console.log('   🔍 Items después del save:', {
      status: verifyRes.status,
      count: verifyResult.count || 0,
      items: verifyResult.items || [],
      debug: verifyResult.debug || null
    });
    
    // 5. Esperar 2 segundos y verificar otra vez
    console.log('\n5️⃣ ESPERANDO 2 SEGUNDOS Y VERIFICANDO OTRA VEZ...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalRes = await fetch(`https://api.quankey.xyz/api/vault/items/${tokenUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const finalResult = await finalRes.json();
    console.log('   🔍 Items después de 2 segundos:', {
      status: finalRes.status,
      count: finalResult.count || 0,
      items: finalResult.items || [],
      debug: finalResult.debug || null
    });
    
    // 6. Resumen del debug
    console.log('\n6️⃣ RESUMEN DEL DEBUG:');
    console.log('   🎫 Token userId:', tokenUserId);
    console.log('   💾 Base de datos:', debugData.debug?.database?.type);
    console.log('   👥 Total usuarios:', debugData.debug?.system?.totalUsers);
    console.log('   📦 Items totales en DB:', debugData.debug?.system?.totalItems);
    console.log('   💾 Save exitoso?', saveResult.success);
    console.log('   📊 Items inmediatamente:', verifyResult.count);
    console.log('   📊 Items después de 2s:', finalResult.count);
    
    if (saveResult.success && finalResult.count === 0) {
      console.error('\n🚨 PROBLEMA IDENTIFICADO:');
      console.error('   El save es exitoso PERO los items no aparecen en la consulta');
      console.error('   Posibles causas:');
      console.error('   1. userId en save != userId en get');
      console.error('   2. Base de datos no persistiendo correctamente');
      console.error('   3. Timeout en transacciones');
      console.error('   4. Error en HybridDatabaseService');
    } else if (!saveResult.success) {
      console.error('\n🚨 PROBLEMA IDENTIFICADO:');
      console.error('   El save está fallando desde el principio');
    } else if (finalResult.count > 0) {
      console.log('\n✅ PROBLEMA RESUELTO:');
      console.log('   Los items se están guardando y recuperando correctamente');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN DEBUG:', error);
  }
  
  console.log('\n🔴 === DEBUGGING COMPLETO FINALIZADO ===');
};

// Función para limpiar items de debug
const cleanupDebugItems = async () => {
  console.log('🧹 Limpiando items de debug...');
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  
  const tokenData = JSON.parse(atob(token.split('.')[1]));
  const tokenUserId = tokenData.userId;
  
  const res = await fetch(`https://api.quankey.xyz/api/vault/items/${tokenUserId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await res.json();
  const debugItems = result.items?.filter(item => 
    item.title?.includes('TEST_DEBUG_') || 
    item.title?.includes('DEBUG_TEST_')
  ) || [];
  
  console.log(`Encontrados ${debugItems.length} items de debug para limpiar`);
  
  for (const item of debugItems) {
    try {
      await fetch(`https://api.quankey.xyz/api/vault/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Eliminado: ${item.title}`);
    } catch (e) {
      console.log(`⚠️ No se pudo eliminar: ${item.title}`);
    }
  }
};

// Ejecutar automáticamente
console.log('🔴 SCRIPT DE DEBUG CARGADO');
console.log('📝 Ejecuta: fullVaultDebug() para hacer debug completo');
console.log('🧹 Ejecuta: cleanupDebugItems() para limpiar items de prueba');
console.log('\n🚀 Ejecutando debug automáticamente...\n');

// Auto-ejecutar
fullVaultDebug();