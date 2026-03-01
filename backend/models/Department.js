const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentId:{
        type: String,
        required: true,
        unique: true
    },
    
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      unique: true,
      required: true, 
      uppercase: true
    },

    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true
    },

    hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    },

    

    description: {
      type: String
    }
  },
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("Department", departmentSchema);
