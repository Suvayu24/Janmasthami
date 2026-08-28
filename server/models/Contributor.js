import mongoose from "mongoose";

const contributorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    amountContributed: {
      type: Number,
      required: true,
      min: 1
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{10,15}$/, "Phone number must be 10 to 15 digits"]
    },
    // The logged-in admin who secured this contribution. Always set
    // server-side from the authenticated admin's session — never taken
    // from client input — so it can't be spoofed.
    facilitatorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    anonymous: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

contributorSchema.index({ amountContributed: -1, createdAt: 1 });

export default mongoose.model("Contributor", contributorSchema);
