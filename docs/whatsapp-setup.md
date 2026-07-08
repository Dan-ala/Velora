# WhatsApp Cloud API — Configuración para Velora

## Requisitos previos

- Cuenta de negocio en Meta Business Suite (https://business.facebook.com/)
- App de tipo "Business" en Meta Developers (https://developers.facebook.com/apps/)
- Producto "WhatsApp" agregado a la app

## Paso a paso

### 1. Crear app en Meta Developers

1. Ir a https://developers.facebook.com/apps/
2. Click "Create App"
3. Seleccionar "Business" como tipo de app
4. Nombre sugerido: `Velora WhatsApp`
5. Asignar a la Business Account de Velora
6. Click "Create App"

### 2. Agregar producto WhatsApp

1. En el dashboard de la app, buscar "Add Products"
2. Click "Set Up" en WhatsApp

### 3. Obtener credenciales

1. Ir a WhatsApp > Configuración de API
2. En "Números de teléfono", copiar el **Phone Number ID** (número como `123456789`)
3. En "Generar tokens de acceso", seleccionar el número y permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Click "Generar token" y **copiar el token inmediatamente** (no se vuelve a mostrar)
5. El token permanente tiene prefijo `EAAT...`

### 4. Configurar en Render

Agregar estas variables de entorno en el servicio de la API:

```
WHATSAPP_API_KEY=EAAT... (token permanente)
WHATSAPP_PHONE_NUMBER=123456789 (Phone Number ID)
WHATSAPP_PROVIDER=meta
```

Redeployear el servicio.

### 5. Probar

1. Crear una orden en velorastore.cc
2. El checkout pide número de teléfono
3. Cuando el pago se confirma, se envía WhatsApp automáticamente

## Notas importantes

### Números de prueba
- Meta asigna un número de teléfono sandbox gratuito para testing
- Solo puede enviar mensajes a números registrados como "testers" en la app
- Para agregar testers: WhatsApp > Configuración de API > Agregar "Contactos de prueba"

### Producción (números reales)
Cuando estés listo para usar un número real:

1. Solicitar "revisión de negocio" en Meta Business Suite
2. La app debe pasar revisión de Meta (1-5 días hábiles)
3. Configurar un número de teléfono real (puede ser virtual, no necesita SIM)
4. El número no debe estar registrado en WhatsApp Messenger

### Costos (2026)
- Primeras 1,000 conversaciones/mes: **gratis**
- Después: ~$0.005 por conversación
- Mensajes de notificación/campaña: tarifa única por conversación

### Plantillas
Para mensajes proactivos (sin que el usuario inicie chat), WhatsApp requiere plantillas aprobadas:
- Categoría "Utility" para notificaciones de pedidos (confirmación, tracking, entrega)
- Se aprueban en 24-48 horas
- El código actual usa mensajes de texto plano (`type: text`), que solo funcionan para respuestas dentro de una conversación iniciada por el usuario

### Alternativas
- **Twilio WhatsApp API**: similar, usa el número de Twilio, pay-per-use
- **WATI**: plataforma SaaS sobre WhatsApp API, más fácil de configurar pero con costo mensual

## Referencias

- https://developers.facebook.com/docs/whatsapp/cloud-api
- https://business.facebook.com/
