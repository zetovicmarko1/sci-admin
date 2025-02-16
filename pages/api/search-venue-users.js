import dbConnect from "@/utils/dbConnect";
import Location from "@/models/location";
import User from "@/models/user"; // Ensure you have a User model

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

  const { venueId, searchUserTerm, page = 1, pageSize = 10 } = req.body;
  const skip = (page - 1) * pageSize;

  try {
    // Fetch venue to get allUsers array
    const venue = await Location.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const userIds = venue.allUsers || []; // Get user IDs from venue

    // Search query for filtering users
    const userQuery = {
      _id: { $in: userIds }, // Filter users who exist in allUsers
      ...(searchUserTerm
        ? {
            $or: [
              { name: new RegExp(searchUserTerm, "i") }, // Case-insensitive name search
              { email: new RegExp(searchUserTerm, "i") }, // Case-insensitive email search
            ],
          }
        : {}),
    };

    // Fetch users with pagination
    const users = await User.find(userQuery).skip(skip).limit(pageSize).exec();

    // Get total count (for frontend pagination)
    const totalUsers = await User.countDocuments(userQuery);

    res.status(200).json({ users, total: totalUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
