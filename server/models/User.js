import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"]
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      // Excluded from normal queries so a stray `User.find()` never leaks
      // password hashes; use .select("+password") where it's needed.
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
