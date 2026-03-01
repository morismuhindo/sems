// const EmployeeIDCard = require("../models/EmployeeIDCard");
// const Employee = require("../models/Employee");

// // Get all employee ID cards with filtering and pagination
// const getAllIDCards = async (req, res) => {
//   try {
//     const { status, search, page = 1, limit = 10 } = req.query;
    
//     // Build query
//     const query = {};
    
//     // Filter by status if provided
//     if (status) {
//       query.status = status;
//     }
    
//     // Search by card number or employee details
//     if (search) {
//       const employees = await Employee.find({
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { employeeId: { $regex: search, $options: "i" } }
//         ]
//       }).select("_id");
      
//       const employeeIds = employees.map(emp => emp._id);
      
//       query.$or = [
//         { cardNumber: { $regex: search, $options: "i" } },
//         { employee: { $in: employeeIds } }
//       ];
//     }
    
//     // Pagination
//     const skip = (page - 1) * limit;
    
//     // Execute query with pagination and populate employee details
//     const idCards = await EmployeeIDCard.find(query)
//       .populate({
//         path: "employee",
//         select: "firstname lastname gender employeeId address phone role employmentType email photo" // ADDED 'photo' HERE
//       })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     // Get total count for pagination info
//     const total = await EmployeeIDCard.countDocuments(query);
    
//     res.status(200).json({
//       success: true,
//       data: idCards,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching ID cards",
//       error: error.message
//     });
//   }
// };

// // Get single ID card by ID
// const getIDCardById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Validate ID
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "ID card ID is required"
//       });
//     }
    
//     // Find ID card by ID and populate employee details
//     const idCard = await EmployeeIDCard.findById(id)
//       .populate({
//         path: "employee",
//         select: "firstname lastname gender employeeId address phone role employmentType email department photo"
//       });
    
//     // Check if ID card exists
//     if (!idCard) {
//       return res.status(404).json({
//         success: false,
//         message: "ID card not found"
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: idCard
//     });
//   } catch (error) {
//     // Handle invalid ObjectId format
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid ID card ID format"
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: "Error fetching ID card",
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   getAllIDCards,
//   getIDCardById
// };




const EmployeeIDCard = require("../models/EmployeeIDCard");
const Employee = require("../models/Employee");

// Get all employee ID cards with filtering and pagination
const getAllIDCards = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search by card number or employee details
    if (search) {
      const employees = await Employee.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      
      const employeeIds = employees.map(emp => emp._id);
      
      query.$or = [
        { cardNumber: { $regex: search, $options: "i" } },
        { employee: { $in: employeeIds } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination and populate employee details
    const idCards = await EmployeeIDCard.find(query)
      .populate({
        path: "employee",
        select: "firstname lastname gender employeeId address phone role employmentType email photo" // ADDED 'photo' HERE
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination info
    const total = await EmployeeIDCard.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: idCards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ID cards",
      error: error.message
    });
  }
};

// Get single ID card by ID
const getIDCardById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID card ID is required"
      });
    }
    
    // Find ID card by ID and populate employee details
    const idCard = await EmployeeIDCard.findById(id)
      .populate({
        path: "employee",
        select: "firstname lastname gender employeeId address phone role employmentType email department photo"
      });
    
    // Check if ID card exists
    if (!idCard) {
      return res.status(404).json({
        success: false,
        message: "ID card not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: idCard
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid ID card ID format"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error fetching ID card",
      error: error.message
    });
  }
};

// Delete ID card by ID
const deleteIDCard = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID card ID is required"
      });
    }
    
    // Find and delete the ID card
    const deletedIDCard = await EmployeeIDCard.findByIdAndDelete(id);
    
    // Check if ID card exists
    if (!deletedIDCard) {
      return res.status(404).json({
        success: false,
        message: "ID card not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "ID card deleted successfully",
      data: deletedIDCard
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid ID card ID format"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error deleting ID card",
      error: error.message
    });
  }
};

module.exports = {
  getAllIDCards,
  getIDCardById,
  deleteIDCard
};