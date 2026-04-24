// import { requireAuth } from "@clerk/express";
// import User from "../models/User.js";

// export const protectRoute = [
//   requireAuth(),
//   async (req, res, next) => {
//     try {
//       const clerkId = req.auth().userId;

//       if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

//       // find user in db by clerk ID
//       const user = await User.findOne({ clerkId });

//       if (!user) return res.status(404).json({ message: "User not found" });

//       // attach user to req
//       req.user = user;

//       next();
//     } catch (error) {
//       console.error("Error in protectRoute middleware", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
// ];


import { clerkClient } from "@clerk/express";

export const protectRoute = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // get user directly from Clerk — no MongoDB needed
    const clerkUser = await clerkClient.users.getUser(userId);

    req.user = {
      _id:          userId,
      clerkId:      userId,
      name:         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      email:        clerkUser.emailAddresses[0]?.emailAddress,
      profileImage: clerkUser.imageUrl,
    };

    next();
  } catch (error) {
    console.error("protectRoute error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};