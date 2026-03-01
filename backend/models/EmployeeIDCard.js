const mongoose = require("mongoose");

const employeeIDCardSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true 
    },

    cardNumber: {
      type: String,
      required: true,
      unique: true
    },

    issueDate: {
      type: Date,
      default: Date.now
    },

    expiryDate: {
      type: Date
    },

    qrCode: {
      type: String 
    },

    photo: {
      type: String, // Store employee photo
      default: null
    },

    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active"
    },

    revokedAt: {
      type: Date
    },

    revokedReason: {
      type: String
    }
  },
  {
    timestamps: true 
  }
);


module.exports = mongoose.model("EmployeeIDCard", employeeIDCardSchema);