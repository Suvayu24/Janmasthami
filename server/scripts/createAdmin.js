// Creates an admin account directly in the database (or updates the
// password of one that already exists). This replaces the public
// registration page — admin accounts are meant to be added by you, not
// signed up for by visitors.
//
// Usage (run from the server/ folder, with server/.env already set up):
//
//   node scripts/createAdmin.js "Full Name" "admin@example.com" "a-strong-password"
//
// or, using the npm script alias (note the extra --):
//
//   npm run create-admin -- "Full Name" "admin@example.com" "a-strong-password"

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const SALT_ROUNDS = 10;

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js "Full Name" "admin@example.com" "password"');
    process.exitCode = 1;
    return;
  }

  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exitCode = 1;
    return;
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.name = name;
    existing.password = hashedPassword;
    await existing.save();
    console.log(`Updated existing admin: ${normalizedEmail}`);
  } else {
    await User.create({ name, email: normalizedEmail, password: hashedPassword });
    console.log(`Created new admin: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to create admin:", error.message);
  process.exitCode = 1;
});

