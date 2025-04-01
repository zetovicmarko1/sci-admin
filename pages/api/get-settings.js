import dbConnect from "@/utils/dbConnect";
import Settings from "@/models/settings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.ADMIN_SECRET_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await dbConnect();

  try {
    const settings = await Settings.findOne();

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error finding settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
