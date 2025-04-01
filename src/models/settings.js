const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  price: { type: Number, default: 7.99 },
  expiryTime: { type: Number, default: 12 }, // in hours
});

module.exports =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
