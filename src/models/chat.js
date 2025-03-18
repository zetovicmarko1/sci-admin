const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  users: [Object],
  messages: [Object],
  locationId: String,
  locationName: String,
  createdAt: { type: Date, default: Date.now },
  shortUrl: { type: String, default: "" },
});

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
