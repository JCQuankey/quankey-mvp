# TAREAS PARA PRÓXIMA SESIÓN

## URGENTE - Resolver Cache:
```bash
cd /home/ubuntu/quankey/frontend
rm -rf build/ node_modules/.cache/ .cache/
npm cache clean --force
npm run build
npx serve -s build -p 3000
```

## VERIFICAR:
- Que carga main.93aae9ac.js (NO main.d65c8132.js)
- POST va a http://localhost:5000/api/identity/quantum-biometric/register
- Backend recibe y procesa el registro
- Usuario se guarda en PostgreSQL

## SI FUNCIONA EL REGISTRO:
- Implementar auto-login post-registro
- Probar operaciones de vault
- Verificar persistencia de sesión
- Test completo end-to-end

## BACKLOG:
- Mejorar manejo de errores de entropy sources
- Implementar cache-busting automático
- Añadir tests de integración
- Documentar API endpoints