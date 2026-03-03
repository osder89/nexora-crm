import { hash } from "bcrypt";
import { PrismaClient, PurchaseStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@minicrm.local";
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";

  const demoTenantId = process.env.SEED_DEMO_TENANT_ID ?? "tenant_demo";
  const demoTenantName = process.env.SEED_DEMO_TENANT_NAME ?? "Demo Company SRL";
  const demoTenantEmail = process.env.SEED_DEMO_TENANT_EMAIL ?? "demo@company.bo";

  const demoAdminEmail = process.env.SEED_DEMO_ADMIN_EMAIL ?? "admin@demo.bo";
  const demoAdminPassword = process.env.SEED_DEMO_ADMIN_PASSWORD ?? "AdminDemo123!";

  const demoVendorEmail = process.env.SEED_DEMO_VENDOR_EMAIL ?? "vendedor@demo.bo";
  const demoVendorPassword = process.env.SEED_DEMO_VENDOR_PASSWORD ?? "VendedorDemo123!";

  const [superHash, adminHash, vendorHash] = await Promise.all([
    hash(superAdminPassword, 10),
    hash(demoAdminPassword, 10),
    hash(demoVendorPassword, 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: { id: demoTenantId },
    update: {
      name: demoTenantName,
      email: demoTenantEmail,
      isActive: true,
      primaryColor: "#0f172a",
    },
    create: {
      id: demoTenantId,
      name: demoTenantName,
      email: demoTenantEmail,
      isActive: true,
      primaryColor: "#0f172a",
      phone: "70000000",
      address: "La Paz, Bolivia",
    },
  });

  await prisma.user.upsert({
    where: { email: superAdminEmail.toLowerCase() },
    update: {
      passwordHash: superHash,
      role: Role.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
    create: {
      email: superAdminEmail.toLowerCase(),
      passwordHash: superHash,
      role: Role.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
  });

  const tenantAdmin = await prisma.user.upsert({
    where: { email: demoAdminEmail.toLowerCase() },
    update: {
      passwordHash: adminHash,
      role: Role.ADMIN_EMPRESA,
      tenantId: tenant.id,
      isActive: true,
    },
    create: {
      email: demoAdminEmail.toLowerCase(),
      passwordHash: adminHash,
      role: Role.ADMIN_EMPRESA,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: demoVendorEmail.toLowerCase() },
    update: {
      passwordHash: vendorHash,
      role: Role.VENDEDOR,
      tenantId: tenant.id,
      isActive: true,
    },
    create: {
      email: demoVendorEmail.toLowerCase(),
      passwordHash: vendorHash,
      role: Role.VENDEDOR,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  const categoryA = await prisma.productCategory.upsert({
    where: {
      id_tenantId: {
        id: "category_demo_a",
        tenantId: tenant.id,
      },
    },
    update: {
      name: "Abarrotes",
      description: "Productos de consumo diario",
      isActive: true,
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "category_demo_a",
      tenantId: tenant.id,
      name: "Abarrotes",
      description: "Productos de consumo diario",
      isActive: true,
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  const categoryB = await prisma.productCategory.upsert({
    where: {
      id_tenantId: {
        id: "category_demo_b",
        tenantId: tenant.id,
      },
    },
    update: {
      name: "Bebidas",
      description: "Refrescos y similares",
      isActive: true,
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "category_demo_b",
      tenantId: tenant.id,
      name: "Bebidas",
      description: "Refrescos y similares",
      isActive: true,
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  await prisma.customer.upsert({
    where: {
      id_tenantId: {
        id: "customer_demo_1",
        tenantId: tenant.id,
      },
    },
    update: {
      firstName: "Cliente",
      lastName: "Demo",
      name: "Cliente Demo",
      nit: "1234567",
      phone: "76543210",
      email: "cliente.demo@demo.bo",
      isActive: true,
    },
    create: {
      id: "customer_demo_1",
      tenantId: tenant.id,
      firstName: "Cliente",
      lastName: "Demo",
      name: "Cliente Demo",
      nit: "1234567",
      phone: "76543210",
      email: "cliente.demo@demo.bo",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      id_tenantId: {
        id: "product_demo_1",
        tenantId: tenant.id,
      },
    },
    update: {
      name: "Producto Demo A",
      categoryId: categoryA.id,
      price: 50,
      cost: 30,
      stock: 30,
      stockMin: 5,
      isActive: true,
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "product_demo_1",
      tenantId: tenant.id,
      categoryId: categoryA.id,
      name: "Producto Demo A",
      sku: "DEMO-A",
      price: 50,
      cost: 30,
      stock: 30,
      stockMin: 5,
      isActive: true,
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  await prisma.product.upsert({
    where: {
      id_tenantId: {
        id: "product_demo_2",
        tenantId: tenant.id,
      },
    },
    update: {
      name: "Producto Demo B",
      categoryId: categoryB.id,
      price: 80,
      cost: 45,
      stock: 20,
      stockMin: 4,
      isActive: true,
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "product_demo_2",
      tenantId: tenant.id,
      categoryId: categoryB.id,
      name: "Producto Demo B",
      sku: "DEMO-B",
      price: 80,
      cost: 45,
      stock: 20,
      stockMin: 4,
      isActive: true,
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  const demoSupplier = await prisma.supplier.upsert({
    where: {
      id_tenantId: {
        id: "supplier_demo_1",
        tenantId: tenant.id,
      },
    },
    update: {
      name: "Proveedor Demo",
      nit: "9001001",
      phone: "71234567",
      email: "proveedor@demo.bo",
      address: "El Alto, Bolivia",
      notes: "Proveedor principal demo",
      isActive: true,
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "supplier_demo_1",
      tenantId: tenant.id,
      name: "Proveedor Demo",
      nit: "9001001",
      phone: "71234567",
      email: "proveedor@demo.bo",
      address: "El Alto, Bolivia",
      notes: "Proveedor principal demo",
      isActive: true,
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  const demoPurchase = await prisma.purchase.upsert({
    where: {
      id_tenantId: {
        id: "purchase_demo_1",
        tenantId: tenant.id,
      },
    },
    update: {
      supplierId: demoSupplier.id,
      status: PurchaseStatus.ORDERED,
      total: 450,
      expectedAt: new Date("2026-03-20T00:00:00.000Z"),
      notes: "Pedido demo para pruebas de recepcion.",
      updatedById: tenantAdmin.id,
      deletedAt: null,
      deletedById: null,
    },
    create: {
      id: "purchase_demo_1",
      tenantId: tenant.id,
      supplierId: demoSupplier.id,
      status: PurchaseStatus.ORDERED,
      total: 450,
      expectedAt: new Date("2026-03-20T00:00:00.000Z"),
      notes: "Pedido demo para pruebas de recepcion.",
      createdById: tenantAdmin.id,
      updatedById: tenantAdmin.id,
    },
  });

  await prisma.purchaseItem.deleteMany({
    where: {
      purchaseId: demoPurchase.id,
      tenantId: tenant.id,
    },
  });

  await prisma.purchaseItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        purchaseId: demoPurchase.id,
        productId: "product_demo_1",
        quantity: 10,
        unitCost: 25,
        subtotal: 250,
        createdById: tenantAdmin.id,
        updatedById: tenantAdmin.id,
      },
      {
        tenantId: tenant.id,
        purchaseId: demoPurchase.id,
        productId: "product_demo_2",
        quantity: 5,
        unitCost: 40,
        subtotal: 200,
        createdById: tenantAdmin.id,
        updatedById: tenantAdmin.id,
      },
    ],
  });

  console.log("Seed completado.");
  console.log(`SUPER_ADMIN: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`ADMIN_EMPRESA: ${demoAdminEmail} / ${demoAdminPassword}`);
  console.log(`VENDEDOR: ${demoVendorEmail} / ${demoVendorPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
