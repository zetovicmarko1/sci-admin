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

  const {
    id,
    email,
    phone,
    image,
    name,
    radius,
    lat,
    lng,
    address,
    postcode,
    state,
    city,
  } = req.body;

  try {
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ message: "Location not found." });
    }

    location.email = email;
    location.phone = phone;
    location.image = image;
    location.name = name;
    location.radius = radius;
    location.geo.coordinates[0] = lng;
    location.geo.coordinates[1] = lat;
    location.address = address;
    location.postcode = postcode;
    location.state = state;
    location.city = city;
    await location.save();

    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
