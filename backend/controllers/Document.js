const Document = require("../models/Document");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { uploadDocumentFile, deleteFile } = require("../middleware/upload");

// Create new document
const createDocument = async (req, res) => {
  try {
    const { title, type, description } = req.body;
    const user = req.user;

    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title and file are required",
      });
    }

    const fileUrl = req.file.url;
    const originalFileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    const document = await Document.create({
      title,
      type: type || "other",
      fileUrl,
      originalFileName,
      fileSize,
      mimeType,
      description: description || "",
      uploadedBy: user.id,
    });

    const populatedDocument = await Document.findById(document._id)
      .populate("uploadedBy", "fullname email role");

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: populatedDocument,
    });
  } catch (error) {
    if (req.file && req.file.path) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all documents with filtering
const getAllDocuments = async (req, res) => {
  try {
    const { type, search } = req.query;

    const filter = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { originalFileName: { $regex: search, $options: 'i' } }
      ];
    }

    const documents = await Document.find(filter)
      .populate("uploadedBy", "fullname email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("uploadedBy", "fullname email role");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid document ID",
      error: error.message
    });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { title, type, description } = req.body;

    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (req.file) {
      deleteFile(document.fileUrl);
      
      document.fileUrl = req.file.url;
      document.originalFileName = req.file.originalname;
      document.fileSize = req.file.size;
      document.mimeType = req.file.mimetype;
    }

    if (title) document.title = title;
    if (type) document.type = type;
    if (description !== undefined) document.description = description;

    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate("uploadedBy", "fullname email role");

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(400).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    deleteFile(document.fileUrl);
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get document statistics
const getDocumentStatistics = async (req, res) => {
  try {
    const total = await Document.countDocuments();

    const totalSize = await Document.aggregate([
      { $group: { _id: null, total: { $sum: "$fileSize" } } }
    ]);

    const byType = await Document.aggregate([
      { 
        $group: { 
          _id: "$type", 
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" }
        } 
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const recentUploads = await Document.find()
      .populate("uploadedBy", "fullname email role")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        total,
        totalSize: totalSize[0]?.total || 0,
        byType,
        recentUploads,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Search documents
const searchDocuments = async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { originalFileName: { $regex: query, $options: 'i' } }
      ]
    };

    if (type && type !== 'all') {
      searchFilter.type = type;
    }

    const documents = await Document.find(searchFilter)
      .populate("uploadedBy", "fullname email role")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentStatistics,
  searchDocuments,
  uploadSingle: uploadDocumentFile 
};