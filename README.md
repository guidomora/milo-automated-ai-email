# Milo AI Mails

Aplicacion web para cargar pedidos logisticos desde un mensaje libre o desde un formulario manual.

El objetivo es que un usuario pueda describir un pedido de transporte en lenguaje natural, revisar los datos detectados por IA, corregirlos si hace falta y luego confirmar el pedido. Al confirmar, el sistema debe registrar la informacion en Google Sheets y enviar un mail con los datos relevantes.

## Flujo Principal

1. El usuario ingresa las caracteristicas del pedido.
   - Puede escribir o dictar un mensaje completo.
   - Tambien puede completar los inputs manualmente.
2. Si usa mensaje libre, la IA analiza el texto y extrae los campos relevantes.
3. La UI popula los inputs con los datos detectados para que el usuario los revise.
4. El usuario corrige los campos si la IA detecto algo mal o si falta informacion.
5. Al confirmar, el pedido se registra en Google Sheets.
6. Luego se envia un mail con campos de la fila registrada.

## Campos Del Pedido

Campos requeridos:

- Tipo de servicio
- Fecha del servicio
- Horario de carga
- Origen
- Destino
- Cantidad de mercaderia en toneladas

Campo opcional:

- Detalle

## Estado Actual

Implementado:

- UI responsive orientada a uso mobile.
- Formulario manual para cargar el pedido.
- Textarea para mensaje libre.
- Boton de dictado usando Web Speech API cuando el navegador lo soporta.
- Fallback para iPhone/Safari, donde el usuario puede usar el microfono del teclado.
- Endpoint `POST /api/orders/extract` para extraer datos desde un mensaje.
- Adapter inicial para Anthropic usando `@anthropic-ai/sdk`.
- Prompt de extraccion estructurada.
- Parser y normalizacion de la respuesta de IA.
- Poblado automatico de los inputs con la respuesta de IA.
- Estado de carga para extraccion y submit.
- Endpoint `POST /api/orders/submit` para registrar pedidos en Google Sheets.
- Adapter server-side para Google Sheets usando `googleapis`.

Pendiente:

- Enviar mail luego de registrar el pedido.
- Definir opciones finales de tipo de servicio.
- Conectar el mail luego del registro en Sheets.

## Arquitectura

La aplicacion usa Next.js con App Router.

Estructura relevante:

```txt
app/
  page.tsx
  OrderForm.tsx
  api/
    orders/
      extract/
        route.ts

lib/
  ai/
    anthropic-provider.ts
    index.ts
    order-extraction-parser.ts
    order-extraction-prompt.ts
    types.ts
  config/
    env.ts
  email/
    index.ts
    order-email.ts
    order-email.test.ts
    types.ts
  orders/
    date-time.ts
    types.ts
    validation.ts
  sheets/
    constants.ts
    google-sheets-adapter.ts
    index.ts
    order-row.ts
    order-row.test.ts
```

### UI

`app/OrderForm.tsx` contiene el formulario interactivo. Es un Client Component porque necesita:

- estado de React,
- eventos de formulario,
- Web Speech API,
- llamadas `fetch` al endpoint de extraccion.

### IA

La capa de IA esta separada en `lib/ai`.

El resto de la app consume un provider generico mediante `getAiProvider()`. Hoy la implementacion usa Anthropic, pero la idea es poder reemplazar el provider en el futuro sin cambiar la UI ni las rutas que consumen IA.

### Configuracion

`lib/config/env.ts` centraliza las variables de entorno server-side.

Usa `.env.template` como referencia para crear tu `.env` local. No commitees `.env`, porque contiene credenciales reales.

La key de IA se lee desde:

```env
AI_KEY=
```

Opcionalmente se puede definir el modelo:

```env
AI_MODEL=
```

Si `AI_MODEL` no esta definido, se usa el modelo por defecto configurado en `env.ts`.

Importante: la key no debe exponerse con prefijo `NEXT_PUBLIC_`, porque eso la enviaria al navegador.

Para Google Sheets se leen estas variables:

```env
GOOGLE_SHEET_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

La hoja de calculo debe estar compartida con `GOOGLE_CLIENT_EMAIL` con permisos de editor. `GOOGLE_PRIVATE_KEY` puede cargarse con saltos de linea reales o con `\n`; la app normaliza ambos formatos.

`SHEETS_KEY` no se usa para escribir en Sheets con service account. Para este flujo alcanza con `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY`.

Para el envio futuro de emails con Microsoft 365 via Microsoft Graph se reservaron estas variables en `.env.template`:

```env
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_SENDER_EMAIL=
MAIL_TO=
MAIL_CC=
MAIL_BCC=
MAIL_FROM_NAME=
```

El flujo previsto es registrar una app en Microsoft Entra ID, agregar el permiso de Microsoft Graph `Mail.Send` como Application permission, dar admin consent, y enviar desde `MICROSOFT_SENDER_EMAIL` usando `/users/{sender}/sendMail`. En produccion conviene limitar esa app al mailbox emisor con una Application Access Policy.

### Email

El template del mail esta preparado en `lib/email/order-email.ts`, pero todavia no se envia hasta conectar Microsoft Graph.

Asunto:

```txt
Nueva solicitud de servicio
```

El cuerpo incluye:

- Tipo de servicio
- Fecha del servicio
- Horario de carga
- Origen
- Destino
- Cantidad de toneladas
- Fecha de registro del pedido
- Hora de registro del pedido

El template devuelve version texto y HTML para que el adapter de Microsoft Graph pueda elegir el formato al enviar.

### Google Sheets

La integracion esta separada en `lib/sheets`.

`lib/sheets/constants.ts` define el nombre de la pestaña:

```ts
GOOGLE_SHEETS_ORDER_SHEET_NAME = "Hoja 1"
```

El registro usa append sobre el rango `Hoja 1!A:I`, por lo que nunca pisa la fila 1 de encabezados y agrega cada pedido en la siguiente fila disponible.

Orden de columnas:

```txt
A Fecha de pedido
B Hora de pedido
C Tipo de servicio
D Fecha del servicio
E Horario de carga
F Origen
G Destino
H Cantidad de mercaderia Tn
I Observacion
```

`Fecha de pedido` y `Hora de pedido` se generan al confirmar el pedido. El resto de los campos viene del formulario, ya sea completado manualmente o poblado por la IA.

## Endpoint De Extraccion

`POST /api/orders/extract`

Body esperado:

```json
{
  "message": "Necesito cargar 28 toneladas manana a las 14 desde Rosario hasta Cordoba"
}
```

Respuesta esperada:

```json
{
  "extraction": {
    "serviceDate": "05/05/2026",
    "loadingTime": "14:00",
    "origin": "Rosario",
    "destination": "Cordoba",
    "serviceType": null,
    "cargoTons": 28,
    "detail": null,
    "missingFields": ["serviceType"]
  }
}
```

`missingFields` incluye solo campos requeridos. `detail` es opcional y no se marca como faltante.

## Endpoint De Registro

`POST /api/orders/submit`

Body esperado:

```json
{
  "serviceType": "Transporte terrestre",
  "serviceDate": "05/05/2026",
  "loadingTime": "14:00",
  "origin": "Rosario",
  "destination": "Cordoba",
  "cargoTons": 28,
  "detail": "Retirar con lona"
}
```

Respuesta esperada:

```json
{
  "ok": true
}
```

El endpoint valida campos requeridos, formatos `dd/mm/aaaa` y `HH:mm`, y cantidad positiva antes de escribir en Google Sheets.

## Comandos

Instalar dependencias:

```bash
npm install
```

Levantar desarrollo:

```bash
npm run dev
```

Ejecutar pruebas:

```bash
npm test
```

Validar lint:

```bash
npm run lint
```

Generar build:

```bash
npm run build
```

Ejecutar produccion luego del build:

```bash
npm run start
```
# milo-automated-ai-email
