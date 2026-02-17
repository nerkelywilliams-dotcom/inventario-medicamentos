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

### 4. **Verificar Logs**

Si aparece en blanco:
1. Abre el Web Service → **Logs**
2. Busca errores como:
   - `DATABASE_URL not set`
   - `Error: connect ECONNREFUSED`
   - `Error: migration failed`

### 5. **Troubleshooting**

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
