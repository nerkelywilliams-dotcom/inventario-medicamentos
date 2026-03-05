# 🔧 Solucionar Error de Autenticación PostgreSQL en Render

## El Problema

El deploy falla con este error:
```
error: password authentication failed for user "postgres"
```

Esto significa que la variable `DATABASE_URL` en Render está mal o no se está cargando correctamente.

---

## ✅ Solución Paso a Paso

### 1. Accede a tu Web Service en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en tu Web Service (`inventario-medicamentos`)
3. En el menú lateral, ve a **Environment**

### 2. Verifica la DATABASE_URL

En la sección **Environment Variables**, verifica que exista:
```
DATABASE_URL = postgresql://...
```

**Si NO está:**
1. Abre tu Database (PostgreSQL) en Render
2. Copia la **Internal Database URL** (la que empieza con `postgresql://`)
3. En tu Web Service → Environment, añade:
   ```
   DATABASE_URL = [pega aquí la URL]
   NODE_ENV = production
   ```

**Si SÍ está:**
- Copia el valor de `DATABASE_URL`
- Verifica que sea la **URL interna** (no la externa)
- Debe verse así:
  ```
  postgresql://user:password@host:5432/database_name
  ```

### 3. Verifica las Credenciales de PostgreSQL

A veces Render reinicia la BD y regenera la contraseña:

1. En Render Dashboard → tu PostgreSQL → **Connections**
2. Copia la **Internal Database URL** (nueva)
3. Reemplaza **completamente** el valor de `DATABASE_URL` en tu Web Service

### 4. Redeploy

Después de actualizar `DATABASE_URL`:

1. **Opción A (recomendada):** 
   - En tu Web Service → **Manual Deploy** → **Deploy Latest Commit**

2. **Opción B (sin rebuild):**
   - No cambies nada, el servidor seguirá arrancando aunque la BD esté desconectada
   - Los datos estáticos se servirán, pero los endpoints de API darán error

---

## 🔍 Cómo Verificar que Funciona

Después del deploy:

1. Abre los **Logs** de tu Web Service
2. Busca estos mensajes:
   ```
   ✅ Migración Maestro-Detalle completada
   ✅ Base de datos inicializada correctamente
   ```
   o
   ```
   ✅ Tabla 'medication_catalog' ya existe
   ```

3. Si el servidor no arranca, verás:
   ```
   ⚠️  Error de conexión a BD (DATABASE_URL probablemente mal configurada)
   ⚠️  El servidor arrancará pero sin acceso a datos.
   ```

---

## 📋 Checklist Final

- [ ] Renato accendido a Render Dashboard
- [ ] Verifiqué que `DATABASE_URL` existe en Environment
- [ ] Copié la **URL INTERNA** de PostgreSQL (postgresql://...)
- [ ] Actualicé `DATABASE_URL` en Web Service
- [ ] Ejecuté Manual Deploy
- [ ] Verifiqué los logs (busco ✅ inicialización correcta)
- [ ] Recargué la app (`Ctrl+F5`)
- [ ] Logueé con `admin_maracay / admin123`

---

## 💡 Notas Importantes

- **URL Interna vs Externa:** Render da dos URLs para la BD:
  - ✅ **Interna** (para Web Service): `postgresql://...` que empieza diferente
  - ❌ **Externa** (para conexiones remotas): no usar para el Web Service

- **Reinicio de BD:** Si Render reinicia tu PostgreSQL, la contraseña cambia automáticamente. Copia la nueva URL desde el panel de PostgreSQL.

- **El servidor ahora es resiliente:** Aunque la BD falle, el servidor arrancará y servirá los archivos estáticos. Los endpoints de API usarán la BD cuando esté disponible.

---

## 🆘 Si Sigue Fallando

1. Abre los **Logs** completos y busca:
   - `password authentication failed` → DATABASE_URL inválida
   - `ECONNREFUSED` → BD offline o URL mal
   - `error: relation "medication_catalog" does not exist` → Migración pendiente

2. Si necesitas resetear la BD:
   - Render Dashboard → tu PostgreSQL → **Reset Database** (¡CUIDADO! Borra todos los datos)
   - Luego redeploy tu Web Service

3. Contacta a [Render Support](https://support.render.com) si:
   - La BD no responde
   - Las credenciales se cachean incorrectamente
