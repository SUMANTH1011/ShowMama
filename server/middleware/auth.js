import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth();   

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
