import dbConnect from "@/utils/dbConnect";
import Message from "@/models/message";
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

  const { chatId, messagesSearchTerm, page = 1, pageSize = 10 } = req.body;
  const skip = (page - 1) * pageSize;

  try {
    // Build search query for name or email only
    const searchQuery = messagesSearchTerm
      ? {
          messageBody: new RegExp(messagesSearchTerm, "i"),
          chatId: new mongoose.Types.ObjectId(String(chatId)),
        }
      : { chatId: new mongoose.Types.ObjectId(String(chatId)) };

    // Fetch users with pagination
    const messages = await Message.find(searchQuery)
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get total count (for frontend pagination)
    const totalMessages = await Message.countDocuments(searchQuery);

    res.status(200).json({ messages, total: totalMessages });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
