# MiniCRM

MiniCRM es una aplicacion SaaS multi-tenant para gestion de clientes, inventario, ventas, pagos y cobranzas.
Moneda unica del sistema: **BOB**.

## Stack

- Next.js 16 (App Router) + TypeScript
- NextAuth (Auth.js) con Credentials + estrategia JWT
- Prisma ORM
- PostgreSQL
- Tailwind CSS

## Seguridad multi-tenant

- Todos los modelos de dominio (users tenant, customers, products, inventory movements, sales, sale items, payments, collection logs) incluyen `tenantId`.
- Todas las consultas de tenant (`findMany/findUnique/update/delete`) filtran por `tenantId` del usuario autenticado.
- Para accesos por ID se usa clave compuesta `id_tenantId` para evitar acceso cruzado entre tenants.
- Middleware:
  - `/super/*` solo `SUPER_ADMIN`
  - `/app/*` solo `ADMIN_EMPRESA` o `VENDEDOR` con `tenantId`

## Roles

- `SUPER_ADMIN`: administra tenants y crea credenciales `ADMIN_EMPRESA`.
- `ADMIN_EMPRESA`: administra su tenant (settings, usuarios vendedor, clientes, productos, ventas, pagos, cobranzas).
- `VENDEDOR`: gestiona clientes/ventas/pagos/cobranzas de su tenant.

## Instalacion

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

3. Ajustar `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` en `.env`.

4. Ejecutar migraciones:

```bash
npm run prisma:deploy
```

Para desarrollo local tambien puedes usar:

```bash
npm run prisma:migrate
```

5. Generar cliente Prisma y seed:

```bash
npm run prisma:generate
npm run prisma:seed
```

6. Ejecutar app:

```bash
npm run dev
```

## Credenciales demo (seed)

Por defecto (puedes cambiar via variables `SEED_*`):

- `SUPER_ADMIN`: `superadmin@minicrm.local` / `SuperAdmin123!`
- `ADMIN_EMPRESA`: `admin@demo.bo` / `AdminDemo123!`
- `VENDEDOR`: `vendedor@demo.bo` / `VendedorDemo123!`

## Rutas principales

- `/login`
- `/super/tenants`
- `/app/dashboard`
- `/app/customers`
- `/app/products`
- `/app/sales`
- `/app/sales/[id]`
- `/app/receivables`
- `/app/settings` (solo `ADMIN_EMPRESA`)
- `/app/users` (solo `ADMIN_EMPRESA`)

## Scripts utiles

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:seed`

## Modelo Prisma

Incluye:

- `Tenant`
- `User` (enum `Role`)
- `Customer`
- `Product`
- `InventoryMovement` (enum `InventoryMovementType`)
- `Sale` (enum `SaleStatus`)
- `SaleItem`
- `Payment` (enum `PaymentMethod`)
- `CollectionLog`

Migracion inicial incluida en `prisma/migrations/20260302170000_init/migration.sql`.

## Reglas de negocio implementadas

- `Sale.total = sum(items.subtotal)`
- `balance = total - sum(payments.amount)`
- Estados de venta:
  - `PAID` si `balance == 0`
  - `OVERDUE` si `balance > 0` y `dueDate < hoy`
  - `PENDING` si `balance > 0` y no esta vencida
- En crear venta:
  - valida stock suficiente por producto
  - descuenta stock
  - registra `InventoryMovement OUT` por item
- Pagos parciales:
  - crean `Payment`
  - recalculan saldo y estado

## Notas

- Build y lint verificados localmente.
- Next.js 16 muestra warning de deprecacion por `middleware.ts`; funcionalmente ya protege rutas. Se puede migrar a `proxy.ts` mas adelante sin cambiar la logica.
