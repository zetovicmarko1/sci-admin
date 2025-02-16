import AWS from "@/config/awsConfig";

const s3 = new AWS.S3();

export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"]; // Read API key from request headers
  const validKey = process.env.ADMIN_SECRET_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const { tnc } = req.query; // Get MIME type from the request

      if (!tnc) {
        return res.status(400).json({ error: "Filename is required" });
      }

      const params = {
        Bucket: "singles-locations", // Ensure this is your correct bucket name
        Key: `${tnc}`,
        Expires: 60, // Time in seconds after which the signed URL expires
        ContentType: "application/pdf",
      };

      const url = await s3.getSignedUrlPromise("putObject", params);
      res.status(200).json({ url });
    } catch (err) {
      console.error("Error generating signed URL:", err);
      res.status(500).json({ error: "Could not generate URL" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
