import dbConnect from "@/utils/dbConnect";
import Location from "@/models/location";

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
    const searchQuery = searchTerm
      ? {
          $or: [
            { name: new RegExp(searchTerm, "i") }, // Case-insensitive name search
          ],
        }
      : {};

    // Fetch users with pagination
    const locations = await Location.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get total count (for frontend pagination)
    const totalLocations = await Location.countDocuments(searchQuery);

    res.status(200).json({ locations, total: totalLocations });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
