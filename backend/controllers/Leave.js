const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const User = require("../models/User");

// Calculate working days (exclude weekends)
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

// Employee applies for leave
const applyForLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const user = await User.findById(req.user.id);
    let employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee && user?.email) {
      employee = await Employee.findOne({ email: user.email });
      if (employee) {
        employee.user = req.user.id;
        await employee.save();
      }
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found. Please contact HR."
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    const totalDays = calculateWorkingDays(start, end);

    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: "You have an overlapping leave request during this period"
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "pending"
    });

    await leave.populate("employee", "firstname lastname email department jobTitle");

    res.status(201).json({
      success: true,
      data: leave,
      message: "Leave application submitted successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leaves with role-based filtering
const getLeaves = async (req, res) => {
  try {
    const {
      status,
      leaveType,
      startDate,
      endDate,
      employeeId,
      department,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (req.user.role === "employee") {
      const user = await User.findById(req.user.id);
      let employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee && user?.email) {
        employee = await Employee.findOne({ email: user.email });
        if (employee) {
          employee.user = req.user.id;
          await employee.save();
        }
      }

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found. Please contact HR."
        });
      }

      query.employee = employee._id;
    }
    else if (req.user.role === "hod") {
      const hodEmployee = await Employee.findOne({ user: req.user.id });
      
      if (!hodEmployee || !hodEmployee.department) {
        return res.status(400).json({
          success: false,
          message: "HOD department not found. Please update your profile."
        });
      }
      
      const employees = await Employee.find({
        department: hodEmployee.department
      }).select("_id");

      if (employees.length > 0) {
        query.employee = { $in: employees.map(e => e._id) };
      } else {
        return res.status(200).json({
          success: true,
          total: 0,
          page: Number(page),
          pages: 0,
          count: 0,
          data: []
        });
      }
    }
    else if (req.user.role === "hr") {
      if (employeeId) {
        query.employee = employeeId;
      }
      if (department) {
        const deptEmployees = await Employee.find({ department }).select("_id");
        query.employee = { $in: deptEmployees.map(e => e._id) };
      }
    }
    else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const skip = (page - 1) * limit;
    
  
    const leaves = await Leave.find(query)
      .populate({
        path: "employee",
        select: "firstname lastname employeeCode department jobTitle",
        populate: {
          path: "department",
          select: "name code"
        }
      })
      .populate("approvedBy", "fullname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("employee", "firstname lastname email department jobTitle employeeCode")
      .populate("approvedBy", "name email role");

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    if (req.user.role === "employee") {
      const user = await User.findById(req.user.id);
      let employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee && user?.email) {
        employee = await Employee.findOne({ email: user.email });
      }
      
      if (employee && leave.employee._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: "Not authorized to view this leave" 
        });
      }
    }

    if (req.user.role === "hod") {
      const employee = await Employee.findById(leave.employee._id);
      if (employee.department.toString() !== req.user.department) {
        return res.status(403).json({ 
          success: false, 
          message: "Not authorized to view this leave" 
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      data: leave 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Approve leave (HR or HOD)
const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate("employee");

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    if (req.user.role === "hod") {
      const employee = await Employee.findById(leave.employee._id);
      const hodEmployee = await Employee.findOne({ user: req.user.id });
      
      if (!hodEmployee) {
        return res.status(403).json({ 
          success: false, 
          message: "HOD employee record not found. Please contact HR to set up your employee profile." 
        });
      }
      
      if (!hodEmployee.department) {
        return res.status(403).json({ 
          success: false, 
          message: "Your employee profile is not assigned to any department. Please contact HR." 
        });
      }
      
      const hodDeptId = hodEmployee.department.toString();
      const employeeDeptId = employee.department ? employee.department.toString() : null;
      
      if (!employeeDeptId || hodDeptId !== employeeDeptId) {
        return res.status(403).json({ 
          success: false, 
          message: "Not authorized to approve leaves outside your department" 
        });
      }
    }

    const overlappingApprovedLeave = await Leave.findOne({
      employee: leave.employee._id,
      _id: { $ne: leave._id },
      status: "approved",
      $or: [
        { startDate: { $lte: leave.endDate }, endDate: { $gte: leave.startDate } }
      ]
    });

    if (overlappingApprovedLeave) {
      return res.status(400).json({
        success: false,
        message: "Employee already has an approved leave during this period"
      });
    }

    leave.status = "approved";
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();

    await leave.save();
    
    await leave.populate("approvedBy", "name email role");
    await leave.populate("employee", "firstname lastname email department jobTitle");

    res.status(200).json({
      success: true,
      data: leave,
      message: "Leave approved successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Reject leave (HR or HOD)
const rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const leave = await Leave.findById(req.params.id).populate("employee");

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    if (req.user.role === "hod") {
      const employee = await Employee.findById(leave.employee._id);
      const hodEmployee = await Employee.findOne({ user: req.user.id });
      
      if (!hodEmployee) {
        return res.status(403).json({ 
          success: false, 
          message: "HOD employee record not found. Please contact HR to set up your employee profile." 
        });
      }
      
      if (!hodEmployee.department) {
        return res.status(403).json({ 
          success: false, 
          message: "Your employee profile is not assigned to any department. Please contact HR." 
        });
      }
      
      const hodDeptId = hodEmployee.department.toString();
      const employeeDeptId = employee.department ? employee.department.toString() : null;
      
      if (!employeeDeptId || hodDeptId !== employeeDeptId) {
        return res.status(403).json({ 
          success: false, 
          message: "Not authorized to reject leaves outside your department" 
        });
      }
    }

    leave.status = "rejected";
    leave.approvedBy = req.user.id;
    leave.rejectionReason = rejectionReason;
    leave.approvedAt = new Date();

    await leave.save();
    
    await leave.populate("approvedBy", "name email role");
    await leave.populate("employee", "firstname lastname email department jobTitle");

    res.status(200).json({
      success: true,
      data: leave,
      message: "Leave rejected successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Cancel leave (employee)
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    const user = await User.findById(req.user.id);
    let employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee && user?.email) {
      employee = await Employee.findOne({ email: user.email });
    }
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee profile not found" 
      });
    }

    if (leave.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to cancel this leave" 
      });
    }

    if (!["pending", "approved"].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or approved leaves can be cancelled"
      });
    }

    if (leave.status === "approved") {
      const today = new Date();
      if (today >= leave.startDate) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel an approved leave that has already started"
        });
      }
    }

    leave.status = "cancelled";
    leave.cancelledAt = new Date();
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave,
      message: "Leave cancelled successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update leave (employee)
const updateLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    const user = await User.findById(req.user.id);
    let employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee && user?.email) {
      employee = await Employee.findOne({ email: user.email });
    }
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee profile not found" 
      });
    }

    if (leave.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to update this leave" 
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be updated"
      });
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : leave.startDate;
      const end = endDate ? new Date(endDate) : leave.endDate;

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }

      const overlappingLeave = await Leave.findOne({
        employee: employee._id,
        _id: { $ne: leave._id },
        status: { $in: ["pending", "approved"] },
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
      });

      if (overlappingLeave) {
        return res.status(400).json({
          success: false,
          message: "You have an overlapping leave request during this period"
        });
      }

      leave.totalDays = calculateWorkingDays(start, end);
    }

    if (startDate) leave.startDate = new Date(startDate);
    if (endDate) leave.endDate = new Date(endDate);
    if (reason) leave.reason = reason;
    if (leaveType) leave.leaveType = leaveType;

    await leave.save();
    
    await leave.populate("employee", "firstname lastname email department jobTitle");

    res.status(200).json({
      success: true,
      data: leave,
      message: "Leave updated successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Delete leave (employee)
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: "Leave not found" 
      });
    }

    const user = await User.findById(req.user.id);
    let employee = await Employee.findOne({ user: req.user.id });
    
    if (!employee && user?.email) {
      employee = await Employee.findOne({ email: user.email });
    }
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee profile not found" 
      });
    }

    if (leave.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this leave" 
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be deleted"
      });
    }

    await leave.deleteOne();

    res.status(200).json({
      success: true,
      message: "Leave deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get leave statistics
const getLeaveStats = async (req, res) => {
  try {
    let match = {};

    if (req.user.role === "employee") {
      const user = await User.findById(req.user.id);
      let employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee && user?.email) {
        employee = await Employee.findOne({ email: user.email });
      }
      
      if (employee) {
        match.employee = employee._id;
      }
    } else if (req.user.role === "hod") {
      const employees = await Employee.find({
        department: req.user.department
      }).select("_id");

      match.employee = { $in: employees.map(e => e._id) };
    }

    const statusStats = await Leave.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const typeStats = await Leave.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$leaveType",
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Leave.aggregate([
      { 
        $match: { 
          ...match,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        statusStats,
        typeStats,
        monthlyStats
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Auto-link employees to users by email
const autoLinkEmployees = async (req, res) => {
  try {
    const allUsers = await User.find({}).select("_id email").lean();
    const allEmployees = await Employee.find({}).select("_id email user firstname lastname").lean();
    
    let linkedCount = 0;
    const results = [];
    
    for (const employee of allEmployees) {
      const user = allUsers.find(u => u.email === employee.email);
      
      if (user && !employee.user) {
        await Employee.findByIdAndUpdate(employee._id, {
          user: user._id
        });
        
        linkedCount++;
        results.push({
          employee: `${employee.firstname} ${employee.lastname}`,
          email: employee.email,
          userId: user._id,
          status: "LINKED"
        });
      } else if (employee.user) {
        results.push({
          employee: `${employee.firstname} ${employee.lastname}`,
          email: employee.email,
          userId: employee.user,
          status: "ALREADY_LINKED"
        });
      } else {
        results.push({
          employee: `${employee.firstname} ${employee.lastname}`,
          email: employee.email,
          userId: null,
          status: "NO_MATCHING_USER"
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Auto-linked ${linkedCount} employees to users`,
      linkedCount,
      results
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  applyForLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave,
  updateLeave,
  deleteLeave,
  getLeaveStats,
  autoLinkEmployees
};