// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create required directories if they don't exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExists('uploads');
    
    if (file.fieldname === 'profilePic') {
      ensureDirectoryExists('uploads/profile');
      return cb(null, 'uploads/profile');
    }
    
    if (file.fieldname === 'logo') {
      ensureDirectoryExists('uploads/logo');
      return cb(null, 'uploads/logo');
    }
    
    if (file.fieldname === 'file') {
      ensureDirectoryExists('uploads/documents');
      return cb(null, 'uploads/documents');
    }
    
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueName = `${safeName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filter for image files
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

// Filter for document files
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    '.doc', '.docx', '.rtf', '.odt',
    '.xls', '.xlsx', '.csv', '.ods',
    '.pdf',
    '.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff',
    '.txt'
  ];
  
  const allowedMimes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'text/plain'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const extname = allowedTypes.includes(ext);
  const mimetype = allowedMimes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid document type. Allowed: Word, Excel, PDF, CSV, Images, and Text files'));
};

// Multer instances for different file types
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter
});

// Handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: `File too large. ${err.field === 'profilePic' || err.field === 'logo' ? '5MB' : '10MB'} maximum` 
      });
    }
    
    if (err.message.includes('Only image files') || err.message.includes('Invalid document type')) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    
    return res.status(400).json({ 
      success: false, 
      message: 'File upload failed',
      error: err.message 
    });
  }
  next();
};

// Profile picture upload middleware
const uploadProfilePic = (req, res, next) => {
  uploadImage.single('profilePic')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (req.file) {
      req.file.url = `/uploads/profile/${req.file.filename}`;
      req.file.type = 'profile';
    }
    next();
  });
};

// Logo upload middleware
const uploadLogo = (req, res, next) => {
  uploadImage.single('logo')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (req.file) {
      req.file.url = `/uploads/logo/${req.file.filename}`;
      req.file.type = 'logo';
    }
    next();
  });
};

// Document upload middleware
const uploadDocumentFile = (req, res, next) => {
  uploadDocument.single('file')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    if (req.file) {
      req.file.url = `/uploads/documents/${req.file.filename}`;
      req.file.type = 'document';
    }
    next();
  });
};

// Generate file URL based on type
const getFileUrl = (filename, type) => {
  if (!filename) return null;
  
  switch(type) {
    case 'profilePic':
      return `/uploads/profile/${filename}`;
    case 'logo':
      return `/uploads/logo/${filename}`;
    case 'document':
      return `/uploads/documents/${filename}`;
    default:
      return `/uploads/${filename}`;
  }
};

// Delete file from server
const deleteFile = (fileUrl) => {
  if (!fileUrl) return false;
  
  const filePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  return false;
};

module.exports = {
  uploadProfilePic,
  uploadLogo,
  uploadDocumentFile,
  getFileUrl,
  deleteFile,
};