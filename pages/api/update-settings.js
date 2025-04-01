import dbConnect from "@/utils/dbConnect";
import Settings from "@/models/settings";

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

  const { price, expiryTime } = req.body;

  try {
    // Check if email or phone is already used by another user
    const settings = await Settings.findOne();

    settings.price = price;
    settings.expiryTime = expiryTime;

    await settings.save();

    res.status(200).json({ message: "settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
