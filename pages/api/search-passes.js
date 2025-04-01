import dbConnect from "@/utils/dbConnect";
import mongoose from "mongoose";
import Purchase from "@/models/purchase";
import Receipt from "@/models/receipt";
import User from "@/models/user";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.ADMIN_SECRET_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await dbConnect();

  const { searchTerm, page = 1, pageSize = 10 } = req.body;
  const skip = (page - 1) * pageSize;

  try {
    // Step 1: Fetch all active passes from "purchases"
    const activePasses = await Purchase.aggregate([
      {
        $lookup: {
          from: "users", // Join with users collection
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // Flatten user array
      {
        $match: searchTerm
          ? {
              $or: [
                { "user.name": new RegExp(searchTerm, "i") },
                { "user.email": new RegExp(searchTerm, "i") },
                { locationName: new RegExp(searchTerm, "i") },
              ],
            }
          : {},
      },
      {
        $project: {
          _id: 1,
          locationId: 1,
          locationName: 1,
          createdAt: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          expired: { $literal: false },
        },
      },
    ]);

    // Step 2: Fetch expired passes from "receipts" that are NOT in "purchases"
    let expiredPasses = await Receipt.aggregate([
      {
        $lookup: {
          from: "users", // Join with users collection
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Lookup purchases to check if this receipt has an active purchase
      {
        $lookup: {
          from: "purchases", // Join with purchases collection
          localField: "purchaseId",
          foreignField: "_id",
          as: "activePass", // This will contain the active purchase if it exists
        },
      },

      // Exclude receipts that still have an active purchase
      {
        $match: {
          activePass: { $size: 0 }, // If `activePass` array is empty, it's expired
          ...(searchTerm
            ? {
                $or: [
                  { "user.name": new RegExp(searchTerm, "i") },
                  { "user.email": new RegExp(searchTerm, "i") },
                  { locationName: new RegExp(searchTerm, "i") },
                ],
              }
            : {}),
        },
      },

      {
        $project: {
          _id: 1,
          locationId: 1,
          locationName: 1,
          createdAt: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          expired: { $literal: true },
        },
      },
    ]);

    // Step 3: Merge both active and expired passes and apply pagination
    const allPasses = [...activePasses, ...expiredPasses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 👈 Sort newest first
      .slice(skip, skip + pageSize);

    res.status(200).json({
      passes: allPasses,
      total: activePasses.length + expiredPasses.length,
    });
  } catch (error) {
    console.error("Error fetching passes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
