import dbConnect from "@/utils/dbConnect";
import User from "@/models/user";
import { message } from "antd";

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

  const { id, banned } = req.body;

  try {
    const user = await User.findById(id);

    if (user) {
      user.banned = banned;
      await user.save();
    }

    res
      .status(200)
      .json({ message: `User ${banned ? "banned" : "unbanned"} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
