# Guía de Deployment en Render

## 🚀 Pasos para desplegar en Render

### 1. **Crear Base de Datos PostgreSQL en Render**

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **New +** → **PostgreSQL**
3. Nombre: `inventario-medicamentos-db`
4. Región: Ohio (free tier)
5. Copia la **Internal Database URL** (la usaremos)

### 2. **Crear Web Service en Render**

1. Click en **New +** → **Web Service**
2. Conecta tu repositorio GitHub
3. Nombre: `inventario-medicamentos`
4. Region: Ohio
5. Runtime: Node
6. Build Command: `npm run build`
7. Start Command: `npm start`

### 3. **Configurar Variables de Entorno**

En el Web Service, ve a **Environment** y añade:

```
DATABASE_URL = postgresql://user:password@host:5432/database
NODE_ENV = production
```

**La DATABASE_URL debe ser la URL interna de tu base de datos PostgreSQL**

### 3.1. **¿Qué sucede durante el deploy?**

El comando `npm start` ejecuta automáticamente:

1. **`npx drizzle-kit push`** - Crea las tablas (migrations)
2. **`tsx scripts/init-db.ts`** - Inicializa datos de prueba:
   - Crea 2 familias farmacológicas por ubicación (maracay, magdaleno)
   - Crea 4 medicamentos en el catálogo
   - Crea 4 usuarios (2 admins y 2 viewers, uno por ubicación)
3. **`node dist/index.js`** - Inicia el servidor

**Por lo tanto, después del primer deploy:**
- ✅ Las tablas estarán listas
- ✅ El inventario tendrá datos de prueba
- ✅ Podrás loguarte con los usuarios creados

### 4. **Verificar Logs y Datos Iniciales**

Si aparece en blanco:
1. Abre el Web Service → **Logs**
2. Busca el mensaje `✅ Base de datos inicializada correctamente`
3. Esto indica que los datos de prueba fueron creados

**Usuarios para prueba (creados automáticamente):**
```
Maracay:
  - admin_maracay / admin123 (Admin)
  - usuario_maracay / perfil123 (Viewer)

Magdaleno:
  - admin_magdaleno / admin123 (Admin)
  - usuario_magdaleno / perfil123 (Viewer)
```

En la página de Login, selecciona **Ubicación: Maracay** e ingresa `admin_maracay / admin123`

### 5. **Troubleshooting**

**Si ves "Base de datos vacía" (0 medicamentos):**
1. Abre los **Logs** del Web Service
2. Busca el mensaje: `✅ Base de datos inicializada correctamente`
   - Si está presente: Los datos están OK, recarga la página
   - Si NO está: Reinicia el Web Service (deploy nuevamente)
3. Alternativamente, ejecuta manualmente en Render CLI:
   ```bash
   render run --service inventario-medicamentos npm run db:init
   ```

**Si ves "Application is not available":**
- Revisa que DATABASE_URL esté configurada
- Ejecuta manualmente: `npm run build` localmente
- Comprueba que el puerto 3000 esté libre

**Si la página está en blanco:**
1. Abre DevTools (F12) → Console
2. ¿Hay errores JavaScript?
3. ¿Falla la petición a `/api/medications`?

**Si la BD no conecta:**
- Verifica que el Internal Database URL sea accesible desde el Web Service
- En Render están en la misma red, así que debería funcionar

### 6. **Logs útiles para depuración**

```bash
# Ver logs desde CLI
render logs inventario-medicamentos

# Ver estado del deployment
render services list
```

---

## 📝 Configuración Local (.env)

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Luego edita `.env` con tu DATABASE_URL local.

---

## 🔄 Re-deployment

Si necesitas re-desplegar después de cambios:

```bash
git push  # GitHub se sincroniza automáticamente con Render
```

Si quieres forzar un nuevo build en Render:
- Dashboard → Web Service → **Manual Deploy** → **Latest Commit**

---

## ✅ Checklist Final

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Web Service conectado a tu repositorio
- [ ] DATABASE_URL configurada en Environment
- [ ] NODE_ENV = production
- [ ] npm run build funciona localmente
- [ ] npm start funciona localmente
- [ ] git push sincroniza automáticamente los cambios
