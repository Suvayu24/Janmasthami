import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Contributor from "../models/Contributor.js";

const router = express.Router();

function sanitizeContributor(contributor) {
  const base = {
    id: contributor._id,
    amountContributed: contributor.amountContributed,
    anonymous: contributor.anonymous,
    createdAt: contributor.createdAt
  };

  if (contributor.anonymous) {
    return base;
  }

  return {
    ...base,
    name: contributor.name,
    rollNumber: contributor.rollNumber,
    roomNumber: contributor.roomNumber,
    phoneNumber: contributor.phoneNumber,
    facilitatorName: contributor.facilitatorName
  };
}

router.get("/", async (_req, res) => {
  try {
    const contributors = await Contributor.find().sort({ amountContributed: -1, createdAt: 1 });
    const totalFunds = contributors.reduce((total, contributor) => total + contributor.amountContributed, 0);
    const sanitized = contributors.map(sanitizeContributor);

    res.json({
      totalFunds,
      leaderboard: sanitized.slice(0, 10),
      contributors: sanitized
    });
  } catch (_error) {
    res.status(500).json({ message: "Could not load contributors" });
  }
});

// Admin-only: only a logged-in admin can add a contributor. This mirrors
// the "Add Contributor" button only being visible to logged-in admins on
// the frontend, but enforces it server-side too.
router.post("/", requireAuth, async (req, res) => {
  try {
    const contributor = await Contributor.create({
      name: req.body.name,
      amountContributed: req.body.amountContributed,
      rollNumber: req.body.rollNumber,
      roomNumber: req.body.roomNumber,
      phoneNumber: req.body.phoneNumber,
      anonymous: Boolean(req.body.anonymous),
      // Taken from the authenticated admin's own session, not from the
      // request body — a contributor can't claim to be facilitated by
      // someone else.
      facilitatorName: req.user.name
    });

    res.status(201).json(sanitizeContributor(contributor));
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((entry) => entry.message)
        .join(", ");
      res.status(400).json({ message });
      return;
    }

    res.status(500).json({ message: "Could not create contributor" });
  }
});

export default router;
