const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "#4f46e5",
  },
  completedDates: [
    {
      type: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Habit", habitSchema);