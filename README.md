# NexTronix FF

Tienda de recargas de videojuegos para Bolivia. Moneda única: bolivianos (Bs). Diseño violeta eléctrico, púrpura, negro y acentos dorados inspirado en la identidad NexTronix FF.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS
- Vercel para despliegue
- Neon PostgreSQL para juegos, paquetes, clientes, pedidos y ajustes de pago
- Shop2TopUp reservado a validación/consulta de ID de jugador
- Telegram Bot API para avisos administrativos

## Secciones
- Tienda pública
- `/admin`: acceso privado y panel dividido en resumen, juegos/precios, pedidos, clientes y QR de pago
- `/api/admin/*`: endpoints protegidos mediante cookie firmada

## Variables obligatorias en Vercel
- `DATABASE_URL`: conexión pooled de Neon
- `ADMIN_PASSWORD`: contraseña privada del administrador
- `AUTH_SECRET`: cadena aleatoria larga para firmar la sesión
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`: avisos de Telegram
- `SHOP2TOPUP_API_KEY` y `SHOP2TOPUP_BASE_URL`: acceso privado al servicio de validación de IDs

No publiques credenciales en GitHub ni las compartas por el chat.

## Base de datos
Las tablas se crean al consultar el panel. También está disponible `database/schema.sql` para ejecutarlo desde Neon SQL Editor.

## Desarrollo
```bash
npm install
npm run dev
```

## Estado
La identidad visual y la base del panel administrativo están implementadas. Para activar el panel hace falta configurar Neon y las variables privadas en Vercel. El flujo público de registro, pedidos, comprobantes y recargas todavía está en construcción; no aceptar pagos reales hasta completar y probar esos flujos.
