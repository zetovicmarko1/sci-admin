const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  messageBody: { type: String, required: true },
  sentAt: { type: Date, required: true },
});

module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
