const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["constitution", "certificate", "policy", "other"],
      default: "other"
    },

    fileUrl: {
      type: String, 
      required: true
    },

    originalFileName: {
      type: String,
      required: true
    },

    fileSize: {
      type: Number,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
documentSchema.index({ organisation: 1, createdAt: -1 });
documentSchema.index({ organisation: 1, type: 1 });
documentSchema.index({ title: "text", description: "text", originalFileName: "text" });

module.exports = mongoose.model("Document", documentSchema);