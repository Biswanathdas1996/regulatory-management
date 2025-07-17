import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function testLogin() {
  try {
    console.log("Testing login functionality...");
    
    const username = "super_admin";
    const password = "password123";
    
    console.log(`Attempting to login with username: ${username}`);
    
    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
      
    console.log("User found:", user ? "YES" : "NO");
    
    if (user) {
      console.log("User details:");
      console.log("- ID:", user.id);
      console.log("- Username:", user.username);
      console.log("- Role:", user.role);
      console.log("- Password hash:", user.password.substring(0, 20) + "...");
      
      // Test password comparison
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("Password valid:", isPasswordValid ? "YES" : "NO");
      
      if (isPasswordValid) {
        console.log("✅ Login should succeed!");
        console.log("User data that would be returned:", {
          id: user.id,
          username: user.username,
          role: user.role,
          category: user.category,
        });
      } else {
        console.log("❌ Password comparison failed");
      }
    } else {
      console.log("❌ User not found in database");
    }
    
  } catch (error) {
    console.error("Error testing login:", error);
  }
}

testLogin();