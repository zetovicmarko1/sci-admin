const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  pronouns: String,
  gender: String,
  phone: Number || String,
  preferences: [String],
  picture: String,
  verified: Boolean,
  isTyping: Boolean,
  verificationString: String,
  verificationExpires: Date,
  birthday: Date,
  nonBinaryGender: String,
  banned: { type: Boolean, default: false },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
