const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: false },
    address: { type: Object, required: true },
    verified: { type: Boolean, default: false },
    geo: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    vouchers: { type: Boolean, default: false },
    allUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

locationSchema.index({ geo: "2dsphere" });

module.exports =
  mongoose.models.Location || mongoose.model("Location", locationSchema);
