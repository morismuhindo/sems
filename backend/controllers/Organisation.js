const Organisation = require("../models/Organisation");
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");

// Create organisation (single organisation allowed)
const createOrganisation = async (req, res) => {
  try {
    const {
      name,
      industry,
      registrationNumber,
      email,
      phone,
      address,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Organisation name is required"
      });
    }

    // Only one organisation allowed in the system
    const existingOrg = await Organisation.findOne({});
    if (existingOrg) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({
        success: false,
        message: "An organisation is already registered. Only one organisation is allowed."
      });
    }

    let logoData = null;
    if (req.file) {
      logoData = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/logo/${req.file.filename}`
      };
    } else if (req.body.logo) {
      logoData = {
        url: req.body.logo
      };
    }

    let addressData = {};
    if (address) {
      if (typeof address === 'string') {
        try {
          addressData = JSON.parse(address);
        } catch (error) {
          addressData = { street: address };
        }
      } else {
        addressData = address;
      }
    }

    const newOrganisation = new Organisation({
      name,
      logo: logoData,
      industry,
      registrationNumber,
      email,
      phone,
      address: addressData,
      status: status || "active"
    });

    await newOrganisation.save();

    res.status(201).json({
      message: "Organisation created successfully",
      success: true,
      data: {
        id: newOrganisation._id,
        name: newOrganisation.name,
        logo: newOrganisation.logo,
        industry: newOrganisation.industry,
        registrationNumber: newOrganisation.registrationNumber,
        email: newOrganisation.email,
        phone: newOrganisation.phone,
        address: newOrganisation.address,
        status: newOrganisation.status,
        createdAt: newOrganisation.createdAt
      }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
 
    res.status(500).json({
      success: false,
      message: "Server error creating organisation",
      error: error.message
    });
  }
};

// Update organisation
const updateOrganisation = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: "Organisation ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID format"
      });
    }

    const updates = req.body;
    const logoFile = req.file;

    const organisation = await Organisation.findById(id);
    if (!organisation) {
      if (logoFile) {
        fs.unlinkSync(logoFile.path);
      }
      return res.status(404).json({
        success: false,
        message: "Organisation not found"
      });
    }

    // Handle logo updates
    if (logoFile) {
      if (organisation.logo && organisation.logo.path && fs.existsSync(organisation.logo.path)) {
        fs.unlinkSync(organisation.logo.path);
      }
      
      organisation.logo = {
        filename: logoFile.filename,
        originalname: logoFile.originalname,
        mimetype: logoFile.mimetype,
        size: logoFile.size,
        path: logoFile.path,
        url: `/uploads/logo/${logoFile.filename}`
      };
    } else if (updates.logo === null || updates.logo === 'null' || updates.logo === '') {
      if (organisation.logo && organisation.logo.path && fs.existsSync(organisation.logo.path)) {
        fs.unlinkSync(organisation.logo.path);
      }
      organisation.logo = null;
    } else if (updates.logo) {
      if (typeof updates.logo === 'string') {
        if (updates.logo.includes('http://localhost:3000/uploads/')) {
          const urlParts = updates.logo.split('/');
          const filename = urlParts[urlParts.length - 1];
          organisation.logo = {
            url: `/uploads/${filename}`
          };
        } else if (updates.logo.startsWith('/uploads/')) {
          organisation.logo = {
            url: updates.logo
          };
        } else {
          organisation.logo = {
            url: updates.logo
          };
        }
      }
    }

    // Update other fields
    Object.keys(updates).forEach(key => {
      if (key !== 'logo' && key !== 'address' && key !== 'id' && key !== '_id') {
        organisation[key] = updates[key];
      }
    });

    // Handle address
    if (updates.address) {
      try {
        if (typeof updates.address === 'string') {
          organisation.address = JSON.parse(updates.address);
        } else {
          organisation.address = updates.address;
        }
      } catch (error) {
        organisation.address = updates.address;
      }
    }

    await organisation.save();

    res.status(200).json({
      success: true,
      message: "Organisation updated successfully",
      data: {
        id: organisation._id,
        name: organisation.name,
        logo: organisation.logo,
        industry: organisation.industry,
        registrationNumber: organisation.registrationNumber,
        email: organisation.email,
        phone: organisation.phone,
        address: organisation.address,
        status: organisation.status,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
      }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    

    res.status(500).json({
      success: false,
      message: "Server error updating organisation",
      error: error.message
    });
  }
};

// Get all organisations
const getAllOrganisations = async (req, res) => {
  try {
    const organisations = await Organisation.find({})
      .select('-__v')
      .sort({ createdAt: -1 });

    const formattedOrganisations = organisations.map(org => {
      let logoUrl = null;
      
      if (org.logo) {
        if (typeof org.logo.url === 'string' && org.logo.url.startsWith('http')) {
          logoUrl = org.logo.url;
        } 
        else if (org.logo.url) {
          const path = org.logo.url.startsWith('/') ? org.logo.url : `/${org.logo.url}`;
          logoUrl = `${req.protocol}://${req.get('host')}${path}`;
        }
      }
      
      return {
        id: org._id,
        name: org.name,
        logo: logoUrl, 
        industry: org.industry,
        registrationNumber: org.registrationNumber,
        email: org.email,
        phone: org.phone,
        address: org.address,
        status: org.status,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedOrganisations.length,
      data: formattedOrganisations
    });

  } catch (error) {
   
    res.status(500).json({
      success: false,
      message: "Server error fetching organisations",
      error: error.message
    });
  }
};

// Get organisation by ID
const getOrganisationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: "Organisation ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID format"
      });
    }

    const organisation = await Organisation.findById(id).select('-__v');
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: "Organisation not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: organisation._id,
        name: organisation.name,
        logo: organisation.logo,
        industry: organisation.industry,
        registrationNumber: organisation.registrationNumber,
        email: organisation.email,
        phone: organisation.phone,
        address: organisation.address,
        status: organisation.status,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
      }
    });

  } catch (error) {
  
    res.status(500).json({
      success: false,
      message: "Server error fetching organisation",
      error: error.message
    });
  }
};

// Delete organisation
const deleteOrganisation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: "Organisation ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID format"
      });
    }

    const organisation = await Organisation.findById(id);
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: "Organisation not found"
      });
    }

    if (organisation.logo && organisation.logo.path && fs.existsSync(organisation.logo.path)) {
      fs.unlinkSync(organisation.logo.path);
    }

    await organisation.deleteOne();

    res.status(200).json({
      success: true,
      message: "Organisation deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error deleting organisation",
      error: error.message
    });
  }
};

module.exports = {
  createOrganisation,
  updateOrganisation,
  getAllOrganisations,
  getOrganisationById,
  deleteOrganisation
};
