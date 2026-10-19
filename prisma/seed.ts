import { PrismaClient } from "@prisma/client";
import { SAMPLE_SHIPMENT } from "../src/lib/freight";

const prisma = new PrismaClient();

const users = [
  {
    email: "procurement@local.test",
    name: "Procurement",
    role: "PROCUREMENT",
    company: "Al Jeel",
  },
  {
    email: "finance@local.test",
    name: "Finance",
    role: "FINANCE",
    company: "Al Jeel",
  },
  {
    email: "forwarder-a@local.test",
    name: "Forwarder A",
    role: "FORWARDER",
    company: "Forwarder A",
  },
  {
    email: "forwarder-b@local.test",
    name: "Forwarder B",
    role: "FORWARDER",
    company: "Forwarder B",
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        company: user.company,
      },
      create: user,
    });
  }

  const procurement = await prisma.user.findUniqueOrThrow({
    where: { email: "procurement@local.test" },
  });

  await prisma.shipment.upsert({
    where: { reference: SAMPLE_SHIPMENT.reference },
    update: {},
    create: {
      ...SAMPLE_SHIPMENT,
      createdById: procurement.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
