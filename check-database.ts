import { db } from "./server/db";
import { users } from "@shared/schema";

async function checkDatabase() {
  try {
    console.log("Checking SQLite database...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log("All users in database:");
    console.log(JSON.stringify(allUsers, null, 2));
    
    // Check super_admin specifically
    const superAdmin = allUsers.find(u => u.username === 'super_admin');
    if (superAdmin) {
      console.log("\nSuper admin found:");
      console.log("ID:", superAdmin.id);
      console.log("Username:", superAdmin.username);
      console.log("Role:", superAdmin.role);
      console.log("Password hash length:", superAdmin.password.length);
    } else {
      console.log("\nSuper admin NOT found!");
    }
    
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkDatabase();