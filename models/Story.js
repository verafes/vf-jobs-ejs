const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter a story title"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please enter a story description"],
      trim: true,
      maxlength: [5000, "Description can't exceed 5000 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    imageUrl: {
      type: String,
      required: false
    },
    storyDate: {
      type: Date,
      default: Date.now
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", StorySchema);