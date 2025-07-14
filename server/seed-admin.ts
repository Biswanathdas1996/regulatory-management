import bcrypt from "bcrypt";
import { storage } from "./storage";

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      role: "ifsca_admin",
      fullName: "IFSCA Administrator",
      email: "admin@ifsca.gov.in",
      organization: "IFSCA",
      isActive: true,
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      fullName: adminUser.fullName,
    });

    // Create sample IFSCA users
    const sampleUsers = [
      {
        username: "banking_user",
        password: await bcrypt.hash("banking123", 10),
        role: "ifsca_user",
        userType: "banking",
        fullName: "Banking Institution User",
        email: "banking@example.com",
        organization: "Sample Bank",
        isActive: true,
      },
      {
        username: "stock_user",
        password: await bcrypt.hash("stock123", 10),
        role: "ifsca_user",
        userType: "stock_exchange",
        fullName: "Stock Exchange User",
        email: "stock@example.com",
        organization: "Sample Stock Exchange",
        isActive: true,
      },
      {
        username: "nbfc_user",
        password: await bcrypt.hash("nbfc123", 10),
        role: "ifsca_user",
        userType: "nbfc",
        fullName: "NBFC User",
        email: "nbfc@example.com",
        organization: "Sample NBFC",
        isActive: true,
      },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (!existingUser) {
        const user = await storage.createUser(userData);
        console.log(`Created sample user: ${user.username} (${user.userType})`);
      }
    }

    console.log("Seed data created successfully");
  } catch (error) {
    console.error("Error seeding admin data:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin().then(() => {
    console.log("Seeding completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export { seedAdmin };