const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  locationName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);
