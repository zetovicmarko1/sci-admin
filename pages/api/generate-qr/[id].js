export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"]; // Read API key from request headers
  const validKey = process.env.ADMIN_SECRET_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const { id } = req.query; // Get MIME type from the request

      if (!id) {
        return res.status(400).json({ error: "Location is required" });
      }
      const url = "process.env.URL" + "/?id=" + id;

      res.status(200).json({ url: url });
    } catch (err) {
      console.error("Error generating QR Code:", err);
      res.status(500).json({ error: "Could not generate QR" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
