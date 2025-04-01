import dbConnect from "@/utils/dbConnect";
import Chat from "@/models/chat";

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
            { "users.name": new RegExp(searchTerm, "i") }, // Search within users array
            { locationName: new RegExp(searchTerm, "i") }, // Search locationName
          ],
        }
      : {};

    // Fetch users with pagination
    const chats = await Chat.find(searchQuery)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get total count (for frontend pagination)
    const totalChats = await Chat.countDocuments(searchQuery);

    res.status(200).json({ chats, total: totalChats });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
