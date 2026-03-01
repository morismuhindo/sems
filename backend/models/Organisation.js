const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
    url: String
  },
  industry: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'inactive'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organisation', organisationSchema);
