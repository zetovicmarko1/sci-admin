import dbConnect from "@/utils/dbConnect";
import User from "@/models/user";

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

  const { id, email, phone } = req.body;

  try {
    // Check if email or phone is already used by another user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      _id: { $ne: id }, // Exclude the current user from the check
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or phone already exists for another user.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.email = email;
    user.phone = phone;
    await user.save();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
