-- SQL Script to add required users to the database
-- This script will insert users with bcrypt-hashed passwords

-- Note: The password hashes below are for:
-- superadmin: admin123
-- ifsca_banking: ifsca123
-- ifsca_nbfc: ifsca123
-- ifsca_stock_exchange: ifsca123

-- First, delete existing users if they exist (optional)
-- DELETE FROM users WHERE username IN ('superadmin', 'ifsca_banking', 'ifsca_nbfc', 'ifsca_stock_exchange');

-- Insert Super Admin user
INSERT INTO users (username, password, role, category, created_by, created_at, updated_at)
VALUES (
  'superadmin',
  '$2b$10$k8I8fHhYvB8YGjjLNzUKKuSJGQ7GtVT9PNOGjRvQMfNHQCeGBs7Xi', -- bcrypt hash for 'admin123'
  'super_admin',
  NULL,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password = '$2b$10$k8I8fHhYvB8YGjjLNzUKKuSJGQ7GtVT9PNOGjRvQMfNHQCeGBs7Xi',
  role = 'super_admin',
  category = NULL,
  updated_at = NOW();

-- Insert IFSCA Banking user
INSERT INTO users (username, password, role, category, created_by, created_at, updated_at)
VALUES (
  'ifsca_banking',
  '$2b$10$mshKnd8Y11N/qZ7WK/8HmuZjkIEbpDFXCIrR/ghe2DFmQLW2F1um6', -- bcrypt hash for 'ifsca123'
  'ifsca_user',
  'banking',
  1, -- Created by superadmin (assuming superadmin has id 1)
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password = '$2b$10$mshKnd8Y11N/qZ7WK/8HmuZjkIEbpDFXCIrR/ghe2DFmQLW2F1um6',
  role = 'ifsca_user',
  category = 'banking',
  updated_at = NOW();

-- Insert IFSCA NBFC user
INSERT INTO users (username, password, role, category, created_by, created_at, updated_at)
VALUES (
  'ifsca_nbfc',
  '$2b$10$R/mUW1OEmJNW0u4tpmwoeujgCfKlEAOf.foPt.fZ877AsSxEnzcWq', -- bcrypt hash for 'ifsca123'
  'ifsca_user',
  'nbfc',
  1, -- Created by superadmin
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password = '$2b$10$R/mUW1OEmJNW0u4tpmwoeujgCfKlEAOf.foPt.fZ877AsSxEnzcWq',
  role = 'ifsca_user',
  category = 'nbfc',
  updated_at = NOW();

-- Insert IFSCA Stock Exchange user
INSERT INTO users (username, password, role, category, created_by, created_at, updated_at)
VALUES (
  'ifsca_stock_exchange',
  '$2b$10$AggRQplatk4Eb2W9IlbKiuZl3KxxPnigC8ic/edgxVlmUYWH7VlAW', -- bcrypt hash for 'ifsca123'
  'ifsca_user',
  'stock_exchange',
  1, -- Created by superadmin
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password = '$2b$10$AggRQplatk4Eb2W9IlbKiuZl3KxxPnigC8ic/edgxVlmUYWH7VlAW',
  role = 'ifsca_user',
  category = 'stock_exchange',
  updated_at = NOW();

-- Verify the users were created
SELECT id, username, role, category, created_at FROM users 
WHERE username IN ('superadmin', 'ifsca_banking', 'ifsca_nbfc', 'ifsca_stock_exchange')
ORDER BY role, username;