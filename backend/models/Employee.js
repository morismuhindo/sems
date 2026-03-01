const mongoose = require("mongoose");
const employeeSchema = new mongoose.Schema({
    employeeCode:{
        type: String,
        unique: true,
        required: true,
    },
    
    firstname:{
        type: String,
        required: true,
        trim: true,
    },

    lastname:{
        type: String,
        required: true,
        trim: true,
    },

    gender: {
        type: String,
        enum:["Male","Female","Did not Indicate"],
        default: "Did not Indicate",
    },

    dateOfBirth:{
        type:Date,
        required: true,
    },

    phone: {
    type:String,
    unique: true,
    },
    email:{
        type:String,
        unique: true,
        lowercase: true
    },
    address:{
        type:String
    },
    photo:{
        type:String
    },
    role: {
        type: String,
        enum: ["hr","hod", "attendancemanager","employee"],
        default: "employee"
    },

    organisation:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required:true,
    },

    department:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Department"
    },

    jobTitle: {
        type: String,
    },

    employmentType:{
        type:String,
        enum: ["full-time","part-time","contract","intern","permanent"],
        default: "full-time"
    },
    hireDate: {
        type: Date,
        required: true
    },
   
    salaryBase:{
        type: Number,
    },
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
    },

    password:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum:["active","inactive","on-leave","suspended","terminated"],
        default: "active"
    }



},{timestamps: true});
module.exports = mongoose.model("Employee", employeeSchema);