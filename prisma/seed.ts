import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const users = [
  {
    email: "procurement@example.test",
    name: "Test Procurement",
    role: "PROCUREMENT",
    company: "Test Company",
    passwordEnv: "SEED_PASSWORD_PROCUREMENT",
  },
  {
    email: "finance@example.test",
    name: "Test Finance",
    role: "FINANCE",
    company: "Test Company",
    passwordEnv: "SEED_PASSWORD_FINANCE",
  },
  {
    email: "forwarder-a@example.test",
    name: "Test Forwarder A",
    role: "FORWARDER",
    company: "Test Forwarder A",
    passwordEnv: "SEED_PASSWORD_FORWARDER_A",
  },
  {
    email: "forwarder-b@example.test",
    name: "Test Forwarder B",
    role: "FORWARDER",
    company: "Test Forwarder B",
    passwordEnv: "SEED_PASSWORD_FORWARDER_B",
  },
] as const;

async function main() {
  const missing = users
    .filter(({ passwordEnv }) => !process.env[passwordEnv])
    .map(({ passwordEnv }) => passwordEnv);
  if (missing.length) {
    throw new Error(
      `Missing required seed password variables: ${missing.join(", ")}`,
    );
  }

  for (const user of users) {
    const passwordHash = await hashPassword(process.env[user.passwordEnv]!);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        company: user.company,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        passwordHash,
      },
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
