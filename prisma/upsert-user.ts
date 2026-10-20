import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const roles = ["PROCUREMENT", "FINANCE", "FORWARDER"] as const;

function readArgs(argv: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be provided as --name value pairs");
    }
    values.set(flag.slice(2), value);
  }
  for (const key of values.keys()) {
    if (!["email", "name", "role", "company"].includes(key)) {
      throw new Error(`Unknown argument: --${key}`);
    }
  }

  const email = values.get("email")?.trim().toLowerCase();
  const name = values.get("name")?.trim();
  const role = values.get("role")?.trim();
  const company = values.get("company")?.trim() || null;
  if (!email || !name || !role) {
    throw new Error("Required arguments: --email --name --role");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Invalid email address");
  }
  if (!roles.includes(role as (typeof roles)[number])) {
    throw new Error(`Role must be one of: ${roles.join(", ")}`);
  }
  return { email, name, role, company };
}

async function main() {
  const user = readArgs(process.argv.slice(2));
  await prisma.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  });
  console.log(`Upserted ${user.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
