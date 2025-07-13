import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedUser() {
  // Check if user with id=1 exists
  const existing = await db.select().from(users).where(eq(users.id, 1));
  if (existing.length === 0) {
    await db.insert(users).values({
      id: 1,
      username: "admin",
      password: "admin123", // In production, use a hashed password!
    });
    console.log("Seeded user with id=1 (username: admin, password: admin123)");
  } else {
    console.log("User with id=1 already exists");
  }
  process.exit(0);
}

seedUser().catch((e) => {
  console.error(e);
  process.exit(1);
});
