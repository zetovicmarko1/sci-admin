import dbConnect from "@/utils/dbConnect";
import Location from "@/models/location";

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
    const deletedVenue = await Location.findByIdAndDelete(id);

    if (!deletedVenue) {
      return res.status(404).json({ message: "Location not found." });
    }

    res.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
