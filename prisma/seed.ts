import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    email: "procurement@example.test",
    name: "Test Procurement",
    role: "PROCUREMENT",
    company: "Test Company",
  },
  {
    email: "finance@example.test",
    name: "Test Finance",
    role: "FINANCE",
    company: "Test Company",
  },
  {
    email: "forwarder-a@example.test",
    name: "Test Forwarder A",
    role: "FORWARDER",
    company: "Test Forwarder A",
  },
  {
    email: "forwarder-b@example.test",
    name: "Test Forwarder B",
    role: "FORWARDER",
    company: "Test Forwarder B",
  },
] as const;

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
