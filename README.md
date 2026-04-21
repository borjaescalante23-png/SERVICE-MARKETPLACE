# Verified — Marketplace Premium de Servicios a Domicilio

## Arquitectura

```
mi-app/
├── backend/          Express + TypeScript + Prisma + SQLite
├── frontend/         React + TypeScript + Vite + Tailwind CSS
└── setup.sh          Script de instalación
```

## Requisitos previos

- Node.js 18+ (https://nodejs.org)
- npm 9+

## Instalación rápida

```bash
chmod +x setup.sh && ./setup.sh
```

O manualmente:

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev   # Puerto 3001

# Frontend (otra terminal)
cd frontend
npm install
npm run dev   # Puerto 5173
```

## Credenciales de prueba

| Rol          | Email                     | Contraseña   |
|-------------|---------------------------|-------------|
| Admin       | admin@marketplace.com     | Admin1234!  |
| Cliente     | cliente@test.com          | Client1234! |
| Profesional | profesional@test.com      | Pro1234!    |

---

## API REST — Documentación

Base URL: `http://localhost:3001/api`

### Autenticación

```
POST /auth/register          Registro de usuario
POST /auth/login             Login (devuelve accessToken + refreshToken)
POST /auth/refresh           Renovar access token
POST /auth/logout            [AUTH] Cerrar sesión
GET  /auth/me                [AUTH] Obtener usuario actual
```

### Profesionales

```
GET  /professionals                     Lista pública (solo APPROVED)
GET  /professionals/:id                 Perfil público con reseñas
GET  /professionals/me                  [PROFESSIONAL] Mi perfil completo
PATCH /professionals/me/bio             [PROFESSIONAL] Actualizar bio
POST /professionals/me/experience       [PROFESSIONAL] Añadir trabajo (multipart: images[], title, description, serviceCategory, approximateDate)
DELETE /professionals/me/experience/:id [PROFESSIONAL] Eliminar entrada
POST /professionals/me/documents        [PROFESSIONAL] Subir documento (multipart: file, type)
```

Parámetros de filtro para GET /professionals:
- `category` — ServiceCategory
- `minRating` — número decimal
- `page`, `limit`

### Servicios

```
POST   /services           [PROFESSIONAL/APPROVED] Crear servicio
PATCH  /services/:id       [PROFESSIONAL] Editar servicio
DELETE /services/:id       [PROFESSIONAL] Desactivar servicio
```

### Reservas

```
GET  /bookings                    [AUTH] Mis reservas
POST /bookings                    [CLIENT] Crear reserva
GET  /bookings/:id                [AUTH] Detalle de reserva
POST /bookings/:id/pay            [CLIENT] Pagar (fondos a escrow)
POST /bookings/:id/accept         [PROFESSIONAL] Aceptar reserva
POST /bookings/:id/start          [PROFESSIONAL] Iniciar servicio
POST /bookings/:id/complete       [AUTH] Marcar completado (libera escrow)
POST /bookings/:id/cancel         [AUTH] Cancelar (devuelve escrow si pagado)
POST /bookings/:id/dispute        [AUTH] Abrir disputa
```

### Reseñas

```
POST /bookings/:id/review              [CLIENT] Crear reseña (solo si COMPLETED + RELEASED)
GET  /professionals/:id/reviews        Lista de reseñas verificadas
```

### Mensajes (Chat)

```
GET  /bookings/:id/messages     [AUTH] Obtener mensajes del chat
POST /bookings/:id/messages     [AUTH] Enviar mensaje (antifraud activo)
```

### Admin

```
GET  /admin/stats                       Estadísticas del dashboard
GET  /admin/professionals/pending       Profesionales pendientes de verificación
POST /admin/professionals/:id/approve   Aprobar profesional
POST /admin/professionals/:id/reject    Rechazar (body: { reason })
POST /admin/users/:id/suspend           Suspender usuario
GET  /admin/disputes                    Disputas abiertas
POST /admin/disputes/:id/resolve        Resolver disputa (body: { resolution, refundClient })
GET  /admin/fraud-events                Eventos anti-fraude
```

---

## Modelo de datos

### User
```
id, email, password(hashed), firstName, lastName, phone?, avatarUrl?,
role(CLIENT|PROFESSIONAL|ADMIN), isActive, isVerified, lastLoginAt, createdAt
```

### ProfessionalProfile
```
id, userId(FK), bio, verificationStatus, verifiedAt, rejectionReason,
avgRating, totalReviews, acceptanceRate, cancellationRate, completedJobs,
isVisible
```

### ExperienceEntry
```
id, professionalId(FK), title, description, serviceCategory, approximateDate,
images[] → ExperienceImage
```

### Service
```
id, professionalId(FK), name, description, category, price, duration, isActive
```

### Booking
```
id, clientId(FK), professionalId(FK), serviceId(FK), status, paymentStatus,
address, scheduledAt, startedAt, completedAt, cancelledAt, totalAmount,
platformFee, professionalAmount, clientNotes
```

### EscrowTransaction
```
id, bookingId(FK unique), amount, status(HELD|RELEASED|REFUNDED|DISPUTED),
heldAt, releasedAt, releaseScheduledAt
```

### Review
```
id, bookingId(FK unique), clientId(FK), rating(1-5), comment, isVerified(true),
qualityScore, punctualityScore, communicationScore
```

### Message
```
id, bookingId(FK), senderId(FK), content, isFlagged, flagReason, isRead
```

### Dispute
```
id, bookingId(FK unique), openedBy, reason, description, status, resolution, resolvedBy
```

### FraudEvent
```
id, userId(FK), eventType, description, metadata(JSON), severity(LOW|MEDIUM|HIGH)
```

---

## Flujo de seguridad

### Verificación de profesionales
1. Registro → Estado PENDING
2. Sube documentos de identidad (OBLIGATORIO)
3. Sube ≥2 entradas de experiencia con imágenes reales (OBLIGATORIO)
4. Admin revisa → APPROVED o REJECTED
5. Solo APPROVED + isVisible=true aparecen en el marketplace

### Flujo de pago (Escrow)
1. Cliente crea reserva → Status: PENDING, Payment: PENDING
2. Cliente paga → Fondos bloqueados en EscrowTransaction (status: HELD)
3. Profesional acepta → Status: ACCEPTED
4. Profesional inicia → Status: IN_PROGRESS
5. Cliente/Profesional completa → Fondos liberados (RELEASED), Status: COMPLETED
6. Auto-liberación tras 24h si no hay confirmación manual

### Sistema anti-fraude
- Detección automática de teléfonos, emails y URLs en mensajes
- Datos sensibles reemplazados por `[DATOS OCULTOS]`
- Evento de fraude registrado con severidad
- Chat solo disponible si hay reserva activa
- Reseñas solo disponibles tras COMPLETED + RELEASED
- Rate limiting: 100 req / 15min por IP

---

## Stack tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Runtime   | Node.js + TypeScript |
| Framework | Express.js |
| ORM       | Prisma |
| DB        | SQLite (dev) / PostgreSQL (prod) |
| Auth      | JWT (access 15m + refresh 7d con rotación) |
| Uploads   | Multer (local) |
| Seguridad | Helmet, CORS, rate-limit, bcrypt |
| Frontend  | React 18 + TypeScript |
| Build     | Vite |
| Estilos   | Tailwind CSS |
| State     | TanStack Query |
| Router    | React Router v6 |

## Para producción

1. Cambiar `DATABASE_URL` a PostgreSQL
2. Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` a valores seguros
3. Configurar almacenamiento de archivos (AWS S3, Cloudflare R2)
4. Configurar pasarela de pago real (Stripe con Stripe Connect para escrow)
5. Ajustar CORS para tu dominio
6. Añadir SSL/TLS
