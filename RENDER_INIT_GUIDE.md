# 🔧 Guía Rápida: Solucionar BD Vacía en Render

## 📌 Tu Problema

Desplegaste la app en Render y la UI funciona perfectamente, pero:
- ✅ El dashboard se muestra
- ✅ Los menús funcionan
- ❌ Pero el inventario está vacío (0 medicamentos)

## ✅ Solución

La app ahora automatiza la inicialización de datos. Cuando ves el inventario vacío:

### Opción 1: Recargar la Página (Más Rápido)
```
1. En Render Dashboard: Web Service → Manual Deploy → Deploy Latest Commit
2. Espera a que aparezca ✅ Base de datos inicializada correctamente en los logs
3. Recarga la página en el navegador
```

### Opción 2: Verificar los Logs
```
1. Render Dashboard → Web Service → Logs
2. Busca estos mensajes:
   ✅ Creando familias farmacológicas...
   ✅ Creando medicamentos del inventario...
   ✅ Creando usuarios...
   ✅ Base de datos inicializada correctamente
3. Si Yes están: Los datos están! Recarga la página
4. Si NO: El script no corrió, necesitas un nuevo deploy
```

## 🔑 Usuarios de Prueba (Ahora Disponibles)

Después de la inicialización, puedes logearte con:

```
Ubicación: Maracay
Usuario:   admin_maracay
Contraseña: admin123
Rol: Admin (acceso completo)
```

O si prefieres un viewer:
```
Usuario:   usuario_maracay
Contraseña: perfil123
Rol: Viewer (solo lectura)
```

## 🎯 Qué Pasa Automáticamente

Cada vez que haces `npm start` en Render:

1. **Migraciones** → Las tablas se crean (solo si no existen)
2. **Seeding** → Si la BD está vacía:
   - Crea 4 familias farmacológicas
   - Crea 4 medicamentos (Paracetamol, Amoxicilina, Dipirona, Diclofenaco)
   - Crea 4 usuarios (admin + viewer en maracay, admin + viewer en magdaleno)
3. **Server** → Inicia la app

## 🚀 Pasos para Que Funcione

### Si es tu primer deploy:
```
1. Crea Web Service en Render
2. Configurar DATABASE_URL en Environment
3. Deploy → npm run build && npm start
4. Espera logs: "✅ Base de datos inicializada correctamente"
5. ¡Listo! Deberías ver medicamentos en el dashboard
```

### Si ya desplegaste pero BD vacía:
```
1. Render Dashboard → Web Service
2. Click en "Manual Deploy" → "Deploy Latest Commit"
3. Espera el mensaje ✅ en los logs
4. Recarga la página en el navegador
```

## 🐛 Si Sigue Vacía

1. Verifica que DATABASE_URL esté en el Web Service → Environment
2. Abre los Logs y comprueba si hay errores
3. Si ves `✅ Base de datos inicializada correctamente` pero sigue vacío:
   - Intenta `Ctrl + Shift + Delete` (limpiar caché)
   - Abre una ventana en modo incógnito
   - Fuerza un reload: `Ctrl + F5`

## 📊 Medicamentos Iniciales

La BD se inicializa con estos medicamentos:

| Nombre        | Familia          | Ubicación | Cantidad | Dosis   |
|--------------|------------------|-----------|----------|---------|
| Paracetamol  | Analgésicos      | Maracay   | 100      | 500mg   |
| Amoxicilina  | Antibióticos     | Maracay   | 5        | 500mg   |
| Dipirona     | Analgésicos      | Magdaleno | 80       | 500mg   |
| Diclofenaco  | Antiinflamatorios| Magdaleno | 60       | 50mg    |

## ✨ Próximos Pasos

Después de verificar que la BD está poblada:
1. Prueba crear un nuevo medicamento (Admin)
2. Prueba editar cantidades (Admin)
3. Prueba el rol Viewer (solo lectura)
4. Verifica que la Bitácora registra cambios

---

**¿Necesitas exportar datos de tu BD local a Render?**
Por ahora, los datos son independientes (local ≠ Render).
Si necesitas migrar datos, cremosun script import/export.
