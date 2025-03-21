import dbConnect from "@/utils/dbConnect";
import User from "@/models/user";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const apiKey = req.headers["x-api-key"]; // Read API key from request headers
  const validKey = process.env.ADMIN_SECRET_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await dbConnect();

  const { searchTerm, page = 1, pageSize = 10 } = req.body;
  const skip = (page - 1) * pageSize;

  try {
    // Build search query for name or email only
    let searchQuery = {};

    if (searchTerm) {
      // Check if searchTerm is a valid ObjectId
      const isObjectId = mongoose.Types.ObjectId.isValid(searchTerm);

      searchQuery = {
        $or: [
          { name: new RegExp(searchTerm, "i") }, // Case-insensitive name search
          { email: new RegExp(searchTerm, "i") },
          ...(isObjectId
            ? [{ _id: new mongoose.Types.ObjectId(String(searchTerm)) }]
            : []), // Search by ObjectId if valid
        ],
      };
    }

    // Fetch users with pagination
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get total count (for frontend pagination)
    const totalUsers = await User.countDocuments(searchQuery);

    res.status(200).json({ users, total: totalUsers });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
