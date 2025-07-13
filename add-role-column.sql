-- Add role column to users table
ALTER TABLE "public"."users" ADD COLUMN "role" integer DEFAULT 0;
