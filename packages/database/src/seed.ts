import { prisma } from "./client";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  console.log("Created test user:", user);

  // Create a sample notification
  const notification = await prisma.notification.create({
    data: {
      type: "SYSTEM",
      title: "Welcome!",
      message: "Welcome to the platform. Your account is ready.",
      userId: user.id,
    },
  });

  console.log("Created sample notification:", notification);

  console.log("✅ Seeding completed!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
