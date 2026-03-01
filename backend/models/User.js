const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["hr", "hod", "attendancemanager", "employee"],
        default: "employee"
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null
    },
    
    passwordChanged: { 
        type: Boolean, 
        default: false 
    },
    passwordChangedAt: { 
        type: Date 
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    lastLogin: {
        type: Date
    },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);