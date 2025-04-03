const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  locationName: { type: String },
  createdAt: { type: Date, default: Date.now, index: { expires: "12h" } },
  selfieTaken: { type: Boolean, default: false },
  radius: { type: Number },
  likes: [String],
  likedBy: [String],
  hidden: [String],
  lastAction: { type: Date, default: null },
  isPublic: { type: Boolean, default: true },
});

module.exports =
  mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
