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
    email,
    phone,
    name,
    lat,
    lng,
    radius,
    address,
    postcode,
    state,
    city,
    ...otherData
  } = req.body;

  try {
    const newLocation = new Location({
      email: email,
      phone: phone,
      name: name,
      geo: { coordinates: [lng, lat], type: "Point" },
      radius: radius,
      address: address,
      postcode: postcode,
      state: state,
      city: city,
      ...otherData,
    });
    await newLocation.save();

    res
      .status(200)
      .json({ newId: newLocation._id, message: "Location added successfully" });
  } catch (error) {
    console.error("Error adding location:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
