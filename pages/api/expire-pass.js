import dbConnect from "@/utils/dbConnect";
import Purchase from "@/models/purchase";

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

  const { id } = req.body;

  try {
    // Delete the pass from the purchases collection
    const deletedPass = await Purchase.findByIdAndDelete(id);

    if (!deletedPass) {
      return res
        .status(404)
        .json({ message: "Pass not found in active purchases." });
    }

    res.status(200).json({ message: "Pass expired successfully" });
  } catch (error) {
    console.error("Error expiring pass:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
