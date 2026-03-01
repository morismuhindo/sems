const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    clockIn: {
      type: Date
    },

    clockOut: {
      type: Date
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "on_leave","system-auto"],
      default: "absent"
    },

    method: {
      type: String,
      enum: ["code", "system-batch"],
      default: "manual"
    },

    autoMarked: {
    type: Boolean,
    default: false
    },
    batchTimestamp: Date,
    markedAt: Date
   },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AttendanceLog", attendanceSchema);
