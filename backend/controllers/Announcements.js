const Announcement = require("../models/Announcements");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const User = require("../models/User");

// HR create system announcement
const hrCreateSystemAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id,
      isSystemWide: true,
      priority: req.body.priority || "medium"
    });

    // Get author details
    const author = await User.findById(announcement.author)
      .select("fullname email")
      .lean();
    
    const responseData = {
      ...announcement.toObject(),
      author: author || { _id: announcement.author },
      department: null 
    };

    res.status(201).json({
      success: true,
      message: "System-wide announcement created",
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create system announcement",
      error: error.message
    });
  }
};

// HR create department announcement
const hrCreateDepartmentAnnouncement = async (req, res) => {
  try {
    if (!req.body.department) {
      return res.status(400).json({
        success: false,
        message: "Department is required for department announcements"
      });
    }
    
    // Validate department exists
    const department = await Department.findById(req.body.department)
      .select("name departmentId code")
      .lean();
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }
    
    // Create with all required fields
    const announcement = await Announcement.create({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id,
      department: req.body.department,
      isSystemWide: false,
      priority: req.body.priority || "medium"
    });
    
    // Get author details
    const author = await User.findById(announcement.author)
      .select("fullname email")
      .lean();
    
    const responseData = {
      ...announcement.toObject(),
      department: department,
      author: author || { _id: announcement.author }
    };

    res.status(201).json({
      success: true,
      message: "Department announcement created",
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create department announcement",
      error: error.message
    });
  }
};

// HOD create department announcement
const hodCreateAnnouncement = async (req, res) => {
  try {
    // Find HOD employee
    const hod = await Employee.findOne({ user: req.user.id })
      .populate('department', 'name departmentId code');

    if (!hod || !hod.department) {
      return res.status(403).json({
        success: false,
        message: "HOD department not found"
      });
    }
    
    const announcement = await Announcement.create({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id,
      department: hod.department._id,
      isSystemWide: false,
      priority: req.body.priority || "medium"
    });

    // Get author details
    const author = await User.findById(announcement.author)
      .select("fullname email")
      .lean();
    
    const responseData = {
      ...announcement.toObject(),
      department: {
        _id: hod.department._id,
        name: hod.department.name,
        departmentId: hod.department.departmentId,
        code: hod.department.code
      },
      author: author || { _id: announcement.author }
    };

    res.status(201).json({
      success: false,
      message: "Department announcement created",
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create department announcement",
      error: error.message
    });
  }
};


//get announcements
const getAnnouncements = async (req, res) => {
  try {
    let query = {};
    let employee = null;

    // HR can see all announcements
    if (req.user.role === 'hr') {
      query = {};
    } 
    // For HOD and regular employees
    else {
      employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found"
        });
      }

      // Show system-wide OR their department's announcements
      query = {
        $or: [
          { isSystemWide: true },
          { department: employee.department }
        ]
      };
    }

  
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 });
    
   const populatedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        const result = announcement.toObject();
        
        try {
          const author = await User.findById(announcement.author)
            .select("fullname email")
            .lean();
          result.author = author || { _id: announcement.author };
        } catch (error) {
          result.author = { _id: announcement.author };
        }
        
        if (!announcement.isSystemWide && announcement.department) {
          try {
            const department = await Department.findById(announcement.department)
              .select("name departmentId code")
              .lean();
            
            if (department) {
              result.department = department;
            } else {
              result.department = null;
            }
          } catch (error) {
            result.department = null;
          }
        } else if (announcement.isSystemWide) {
          result.department = null;
        } else if (!announcement.isSystemWide && !announcement.department) {

          const anyDepartment = await Department.findOne()
            .select("name departmentId code")
            .lean();
          
          if (anyDepartment && req.user.role === 'hr') {
            announcement.department = anyDepartment._id;
            await announcement.save();
            result.department = anyDepartment;
          } else {
            result.department = null;
          }
        }
        
        return result;
      })
    );

    res.status(200).json({
      success: true,
      total: populatedAnnouncements.length,
      data: populatedAnnouncements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load announcements",
      error: error.message
    });
  }
};


//update announcements
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    // Authorization - only HR and HOD can update
    if (req.user.role !== 'hr' && req.user.role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update announcements"
      });
    }

    // HOD can only update their department's announcements
    if (req.user.role === 'hod') {
      const hod = await Employee.findOne({ user: req.user.id });
      if (!hod || !hod.department || 
          announcement.department.toString() !== hod.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this announcement"
        });
      }
    }

    // Update basic fields
    announcement.title = req.body.title || announcement.title;
    announcement.content = req.body.content || announcement.content;
    announcement.priority = req.body.priority || announcement.priority;

    // HR can change department/isSystemWide
    if (req.user.role === 'hr') {
      if (req.body.isSystemWide !== undefined) {
        announcement.isSystemWide = req.body.isSystemWide;
        
        if (req.body.isSystemWide) {
          announcement.department = undefined;
        } else if (req.body.department) {
  
          const department = await Department.findById(req.body.department)
            .select("name departmentId code")
            .lean();
          
          if (!department) {
            return res.status(404).json({
              success: false,
              message: "Department not found"
            });
          }
          announcement.department = req.body.department;
        }
      } else if (req.body.department && !announcement.isSystemWide) {
        const department = await Department.findById(req.body.department)
          .select("name departmentId code")
          .lean();
        
        if (!department) {
          return res.status(404).json({
            success: false,
            message: "Department not found"
          });
        }
        announcement.department = req.body.department;
      }
    }

    await announcement.save();
    
    const author = await User.findById(announcement.author)
      .select("fullname email")
      .lean();
    
    let department = null;
    if (!announcement.isSystemWide && announcement.department) {
      department = await Department.findById(announcement.department)
        .select("name departmentId code")
        .lean();
    }
    
    const updatedAnnouncement = {
      ...announcement.toObject(),
      author: author || { _id: announcement.author },
      department: department
    };

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};


//delete announcements
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    // Authorization
    if (req.user.role !== 'hr' && req.user.role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete announcements"
      });
    }

    // HOD can only delete their department's announcements
    if (req.user.role === 'hod') {
      const hod = await Employee.findOne({ user: req.user.id });
      if (!hod || !hod.department || 
          announcement.department.toString() !== hod.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this announcement"
        });
      }
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};


//statistics
const getAnnouncementStats = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'hr') {
      query = {};
    } else {
      const employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee || !employee.department) {
        return res.status(403).json({
          success: false,
          message: "Employee department not found"
        });
      }
      query = {
        $or: [
          { isSystemWide: true },
          { department: employee.department }
        ]
      };
    }

    const totalAnnouncements = await Announcement.countDocuments(query);
    const systemAnnouncements = await Announcement.countDocuments({ 
      ...query, 
      isSystemWide: true 
    });
    const departmentAnnouncements = totalAnnouncements - systemAnnouncements;

    // Priority breakdown
    const priorityStats = await Announcement.aggregate([
      { $match: query },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentAnnouncements = await Announcement.countDocuments({
      ...query,
      createdAt: { $gte: oneWeekAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalAnnouncements,
        system: systemAnnouncements,
        department: departmentAnnouncements,
        priority: priorityStats,
        recent: recentAnnouncements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message
    });
  }
};

module.exports = {
  hrCreateSystemAnnouncement,
  hrCreateDepartmentAnnouncement,
  hodCreateAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats
};