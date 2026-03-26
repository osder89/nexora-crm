import { hash } from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

type InitialTenantSeedConfig = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  primaryColor: string;
  adminEmail: string;
  adminPassword: string;
};

async function main() {
  const superAdminEmail = readEnv("SEED_SUPER_ADMIN_EMAIL") ?? "superadmin@minicrm.local";
  const superAdminPassword = readSeedPassword("SEED_SUPER_ADMIN_PASSWORD", "SuperAdmin123!");
  const initialTenant = readInitialTenantSeedConfig();

  const [superAdminHash, tenantAdminHash] = await Promise.all([
    hash(superAdminPassword, 10),
    initialTenant ? hash(initialTenant.adminPassword, 10) : Promise.resolve<string | null>(null),
  ]);

  await prisma.user.upsert({
    where: { email: superAdminEmail.toLowerCase() },
    update: {
      passwordHash: superAdminHash,
      role: Role.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
    create: {
      email: superAdminEmail.toLowerCase(),
      passwordHash: superAdminHash,
      role: Role.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
  });

  console.log(`SUPER_ADMIN: ${superAdminEmail} / ${superAdminPassword}`);

  if (!initialTenant || !tenantAdminHash) {
    console.log("Seed completado sin datos demo. Solo se creo/actualizo el super admin.");
    return;
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: initialTenant.id },
    update: {
      name: initialTenant.name,
      email: initialTenant.email,
      phone: initialTenant.phone,
      address: initialTenant.address,
      isActive: true,
      primaryColor: initialTenant.primaryColor,
    },
    create: {
      id: initialTenant.id,
      name: initialTenant.name,
      email: initialTenant.email,
      phone: initialTenant.phone,
      address: initialTenant.address,
      isActive: true,
      primaryColor: initialTenant.primaryColor,
    },
  });

  await prisma.user.upsert({
    where: { email: initialTenant.adminEmail.toLowerCase() },
    update: {
      passwordHash: tenantAdminHash,
      role: Role.ADMIN_EMPRESA,
      tenantId: tenant.id,
      isActive: true,
    },
    create: {
      email: initialTenant.adminEmail.toLowerCase(),
      passwordHash: tenantAdminHash,
      role: Role.ADMIN_EMPRESA,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  console.log(`TENANT INICIAL: ${tenant.name}`);
  console.log(`ADMIN_EMPRESA: ${initialTenant.adminEmail} / ${initialTenant.adminPassword}`);
  console.log("Seed completado sin datos demo de clientes, productos, proveedores o compras.");
}

function readInitialTenantSeedConfig(): InitialTenantSeedConfig | null {
  const id = readEnv("SEED_TENANT_ID") ?? "tenant_initial";
  const name = readEnv("SEED_TENANT_NAME");
  const email = readEnv("SEED_TENANT_EMAIL");
  const phone = readEnv("SEED_TENANT_PHONE");
  const address = readEnv("SEED_TENANT_ADDRESS");
  const primaryColor = readEnv("SEED_TENANT_PRIMARY_COLOR") ?? "#0f172a";
  const adminEmail = readEnv("SEED_TENANT_ADMIN_EMAIL");
  const adminPassword = readEnv("SEED_TENANT_ADMIN_PASSWORD");

  const hasTenantSeedInput = Boolean(name || email || phone || address || adminEmail || adminPassword || readEnv("SEED_TENANT_ID"));

  if (!hasTenantSeedInput) {
    return null;
  }

  if (!name || !adminEmail || !adminPassword) {
    throw new Error(
      "Para crear el tenant inicial debes definir SEED_TENANT_NAME, SEED_TENANT_ADMIN_EMAIL y SEED_TENANT_ADMIN_PASSWORD.",
    );
  }

  return {
    id,
    name,
    email,
    phone,
    address,
    primaryColor,
    adminEmail,
    adminPassword,
  };
}

function readSeedPassword(name: string, developmentFallback: string) {
  const value = readEnv(name);

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Debes definir ${name} para ejecutar el seed en produccion.`);
  }

  return developmentFallback;
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
