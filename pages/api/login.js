export default function handler(req, res) {
  const { username, password } = req.body;
  const validUsername = process.env.ADMIN_USERNAME; // Use the env variable
  const validPassword = process.env.ADMIN_PASSWORD; // Use the env variable

  if (username === validUsername && password === validPassword) {
    return res
      .status(200)
      .json({ success: true, key: process.env.ADMIN_SECRET_KEY });
  }

  return res
    .status(403)
    .json({ success: false, message: "Invalid credentials" });
}
