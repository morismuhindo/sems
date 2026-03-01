const mongoose = require('mongoose'); 
const AttendanceLog = require("../models/Attendance");
const Employee = require("../models/Employee");

// Calculate attendance status based on clock-in time
const calculateStatus = (clockInTime, shiftStartTime = "09:00") => {
  const [hours, minutes] = shiftStartTime.split(":").map(Number);
  const shiftStart = new Date(clockInTime);
  shiftStart.setHours(hours, minutes, 0, 0);
  
  const lateThreshold = 15 * 60 * 1000;
  
  if (clockInTime.getTime() > shiftStart.getTime() + lateThreshold) {
    return "late";
  }
  
  return "present";
};

// Check if date is a weekend
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Automatically mark absent for previous working days
const checkAndMarkPreviousAbsent = async (employeeId, employeeName = '') => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= 7; i++) {
      const previousDate = new Date(today);
      previousDate.setDate(previousDate.getDate() - i);
      
      if (isWeekend(previousDate)) {
        continue;
      }
      
      const dayStart = new Date(previousDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const existingRecord = await AttendanceLog.findOne({
        employee: employeeId,
        date: { $gte: dayStart, $lt: dayEnd }
      });
      
      if (!existingRecord) {
        await AttendanceLog.create({
          employee: employeeId,
          date: dayStart,
          status: "absent",
          method: "system-auto",
          notes: `Automatically marked absent when employee clocked in on ${today.toDateString()}`,
          autoMarked: true,
          markedAt: new Date()
        });
      } else {
        break;
      }
    }
  } catch (error) {
  }
};

// Clock in employee
const clockIn = async (req, res) => {
  try {
    const { employeeCode, method = "code" } = req.body;
    
    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required"
      });
    }

    const employee = await Employee.findOne({ 
      employeeCode: employeeCode,
      status: "active" 
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or inactive"
      });
    }

    await checkAndMarkPreviousAbsent(
      employee._id, 
      `${employee.firstname} ${employee.lastname}`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceLog.findOne({
      employee: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.status === 'absent') {
      const currentTime = new Date();
      const defaultShiftStartTime = "09:00";
      
      const updatedAttendance = await AttendanceLog.findByIdAndUpdate(
        existingAttendance._id,
        {
          clockIn: currentTime,
          method,
          status: calculateStatus(currentTime, defaultShiftStartTime),
          clockOut: null,
          autoMarked: false,
          notes: `Updated from absent to ${calculateStatus(currentTime, defaultShiftStartTime)}`
        },
        { new: true }
      ).populate("employee", "firstname lastname employeeCode department jobTitle");

      return res.status(200).json({
        success: true,
        data: updatedAttendance,
        message: `Clock in successful (updated from absent) for ${employee.firstname} ${employee.lastname}`
      });
    }

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: "Already clocked in today"
      });
    }

    let attendance;
    const currentTime = new Date();
    const defaultShiftStartTime = "09:00";
    
    if (existingAttendance) {
      attendance = await AttendanceLog.findByIdAndUpdate(
        existingAttendance._id,
        {
          clockIn: currentTime,
          method,
          status: calculateStatus(currentTime, defaultShiftStartTime),
          autoMarked: false
        },
        { new: true }
      ).populate("employee", "firstname lastname employeeCode department jobTitle");
    } else {
      attendance = await AttendanceLog.create({
        employee: employee._id,
        date: currentTime,
        clockIn: currentTime,
        method,
        status: calculateStatus(currentTime, defaultShiftStartTime),
        autoMarked: false
      });
      
      attendance = await attendance.populate("employee", "firstname lastname employeeCode department jobTitle");
    }

    res.status(201).json({
      success: true,
      data: attendance,
      message: `Clock in successful for ${employee.firstname} ${employee.lastname}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Clock out employee
const clockOut = async (req, res) => {
  try {
    const { employeeCode } = req.body;
    
    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required"
      });
    }

    const employee = await Employee.findOne({ 
      employeeCode: employeeCode,
      status: "active"
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or inactive"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceLog.findOne({
      employee: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for today"
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: "Already clocked out today"
      });
    }

    attendance.clockOut = new Date();
    await attendance.save();

    const updatedAttendance = await AttendanceLog.findById(attendance._id)
      .populate("employee", "firstname lastname employeeCode department jobTitle");

    res.status(200).json({
      success: true,
      data: updatedAttendance,
      message: `Clock out successful for ${employee.firstname} ${employee.lastname}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Verify employee code and get details
const verifyEmployeeCode = async (req, res) => {
  try {
    const { employeeCode } = req.body;
    
    if (!employeeCode || employeeCode.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Employee code is required"
      });
    }

    const cleanCode = employeeCode.trim();
    
    const employee = await Employee.findOne({
      employeeCode: cleanCode
    })
    .select("_id firstname lastname employeeCode email phone department jobTitle role status photo")
    .populate('department', 'name'); 
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with code "${cleanCode}" not found`
      });
    }

    if (employee.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Employee account is ${employee.status}. Please contact HR.`,
        data: {
          name: `${employee.firstname} ${employee.lastname}`,
          employeeCode: employee.employeeCode,
          department: employee.department ? employee.department.name : null,
          status: employee.status
        }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceLog.findOne({
      employee: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let departmentData = employee.department;
    if (departmentData && typeof departmentData === 'object') {
      departmentData = {
        _id: departmentData._id,
        name: departmentData.name
      };
    } else {
      departmentData = {
        _id: employee.department,
        name: null
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: `${employee.firstname} ${employee.lastname}`,
          firstname: employee.firstname,
          lastname: employee.lastname,
          employeeCode: employee.employeeCode,
          email: employee.email,
          phone: employee.phone,
          department: departmentData, 
          jobTitle: employee.jobTitle,
          role: employee.role,
          photo: employee.photo,
          status: employee.status
        },
        todayAttendance: attendance || null,
        currentTime: new Date().toISOString(),
        suggestedAction: attendance && attendance.clockIn && !attendance.clockOut ? 'clock-out' : 'clock-in',
        canClockIn: !attendance || !attendance.clockIn,
        canClockOut: attendance && attendance.clockIn && !attendance.clockOut
      },
      message: `Welcome ${employee.firstname} ${employee.lastname}!`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while verifying employee",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Automatic absent marking for non-attended employees
const markAbsentAutomatically = async (req, res) => {
  try {
    const { date, markPreviousDays = false } = req.body;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    if (isWeekend(targetDate)) {
      return res.status(200).json({
        success: true,
        message: "Skipping weekend",
        data: { 
          date: targetDate.toDateString(), 
          isWeekend: true,
          day: targetDate.getDay() === 0 ? 'Sunday' : 'Saturday'
        }
      });
    }

    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const activeEmployees = await Employee.find({ status: "active" });
    
    const attendance = await AttendanceLog.find({
      date: { $gte: targetDate, $lt: nextDay },
      status: { $in: ["present", "late"] }
    });

    const attendedEmployeeIds = attendance.map(a => a.employee.toString());
    let markedCount = 0;
    const markedEmployees = [];

    for (const employee of activeEmployees) {
      if (!attendedEmployeeIds.includes(employee._id.toString())) {
        const existing = await AttendanceLog.findOne({
          employee: employee._id,
          date: { $gte: targetDate, $lt: nextDay }
        });

        if (!existing) {
          await AttendanceLog.create({
            employee: employee._id,
            date: targetDate,
            status: "absent",
            method: "system-batch",
            notes: `Batch auto-marked absent for ${targetDate.toDateString()}`,
            autoMarked: true,
            batchTimestamp: new Date()
          });
          
          markedCount++;
          markedEmployees.push({
            name: `${employee.firstname} ${employee.lastname}`,
            employeeCode: employee.employeeCode
          });
        }
      }
    }

    let previousDaysMarked = 0;
    if (markPreviousDays) {
      for (let i = 1; i <= 30; i++) {
        const previousDate = new Date(targetDate);
        previousDate.setDate(previousDate.getDate() - i);
        
        if (isWeekend(previousDate)) continue;
        
        const result = await markAbsentForSingleDate(previousDate, activeEmployees);
        previousDaysMarked += result.markedCount;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toDateString(),
        totalActiveEmployees: activeEmployees.length,
        presentCount: attendedEmployeeIds.length,
        newlyMarkedAbsent: markedCount,
        previousDaysMarked: markPreviousDays ? previousDaysMarked : undefined,
        markedEmployees,
        timestamp: new Date()
      },
      message: `Successfully marked ${markedCount} employees as absent for ${targetDate.toDateString()}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Helper for marking absent for single date
const markAbsentForSingleDate = async (date, activeEmployees) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const attendance = await AttendanceLog.find({
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["present", "late"] }
  });

  const attendedEmployeeIds = attendance.map(a => a.employee.toString());
  let markedCount = 0;

  for (const employee of activeEmployees) {
    if (!attendedEmployeeIds.includes(employee._id.toString())) {
      const existing = await AttendanceLog.findOne({
        employee: employee._id,
        date: { $gte: dayStart, $lt: dayEnd }
      });

      if (!existing) {
        await AttendanceLog.create({
          employee: employee._id,
          date: dayStart,
          status: "absent",
          method: "system-batch",
          notes: `Retroactive auto-marked absent for ${dayStart.toDateString()}`,
          autoMarked: true
        });
        markedCount++;
      }
    }
  }

  return { date: dayStart, markedCount };
};

// Get all attendance records with filtering
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      employeeCode,
      department,
      status
    } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (employeeCode) {
      const employee = await Employee.findOne({ employeeCode }).select("_id");
      if (employee) {
        query.employee = employee._id;
      }
    }

    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      query.employee = { $in: employees.map(emp => emp._id) };
    }

    if (status) {
      query.status = status;
    }

    const attendance = await AttendanceLog.find(query)
      .sort({ date: -1, clockIn: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: "employee",
        select: "firstname lastname employeeCode email department jobTitle",
        populate: {
          path: "department",
          select: "name" 
        }
      });

    const total = await AttendanceLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get attendance by ID
const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await AttendanceLog.findById(id)
      .populate("employee", "firstname lastname employeeCode department jobTitle");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get attendance for specific employee
const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    const employee = await Employee.findOne({ employeeCode });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const query = { employee: employee._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const attendance = await AttendanceLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate("employee", "firstname lastname employeeCode department jobTitle");

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === "present").length,
      late: attendance.filter(a => a.status === "late").length,
      absent: attendance.filter(a => a.status === "absent" && !a.autoMarked).length,
      autoAbsent: attendance.filter(a => a.status === "absent" && a.autoMarked).length,
      on_leave: attendance.filter(a => a.status === "on_leave").length,
    };

    res.status(200).json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: `${employee.firstname} ${employee.lastname}`,
          employeeCode: employee.employeeCode,
          department: employee.department,
          jobTitle: employee.jobTitle
        },
        summary,
        records: attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, status, method } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await AttendanceLog.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    const updateData = {};
    if (clockIn) updateData.clockIn = new Date(clockIn);
    if (clockOut) updateData.clockOut = new Date(clockOut);
    if (status) updateData.status = status;
    if (method) updateData.method = method;

    const updatedAttendance = await AttendanceLog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("employee", "firstname lastname employeeCode department jobTitle");

    res.status(200).json({
      success: true,
      data: updatedAttendance,
      message: "Attendance updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await AttendanceLog.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get today's attendance summary
const getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const totalActiveEmployees = await Employee.countDocuments({ status: "active" });

    const attendanceToday = await AttendanceLog.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate("employee", "firstname lastname employeeCode department");

    const presentRecords = attendanceToday.filter(a => a.status === "present");
    const lateRecords = attendanceToday.filter(a => a.status === "late");
    const absentRecords = attendanceToday.filter(a => a.status === "absent");
    const autoAbsentRecords = absentRecords.filter(a => a.autoMarked);

    const summary = {
      totalActiveEmployees,
      present: presentRecords.length,
      late: lateRecords.length,
      absent: absentRecords.length,
      autoMarkedAbsent: autoAbsentRecords.length,
      manualAbsent: absentRecords.length - autoAbsentRecords.length,
      on_leave: attendanceToday.filter(a => a.status === "on_leave").length,
      totalMarked: attendanceToday.length,
      pendingClockOut: attendanceToday.filter(a => a.clockIn && !a.clockOut).length
    };

    const byDepartment = {};
    attendanceToday.forEach(record => {
      const deptName = record.employee?.department?.name || "Unknown";
      if (!byDepartment[deptName]) {
        byDepartment[deptName] = {
          present: 0,
          late: 0,
          absent: 0,
          autoAbsent: 0,
          total: 0
        };
      }
      byDepartment[deptName][record.status]++;
      if (record.status === "absent" && record.autoMarked) {
        byDepartment[deptName].autoAbsent++;
      }
      byDepartment[deptName].total++;
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        byDepartment,
        today: today.toDateString(),
        records: attendanceToday.slice(0, 10),
        totalRecords: attendanceToday.length
      },
      message: "Today's attendance summary"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Mark absent for date range
const markAbsentForDateRange = async (req, res) => {
  try {
    const { startDate, endDate, excludeWeekends = true } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const activeEmployees = await Employee.find({ status: "active" });

    let totalMarked = 0;
    const results = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (excludeWeekends && isWeekend(date)) {
        continue;
      }

      const result = await markAbsentForSingleDate(date, activeEmployees);
      totalMarked += result.markedCount;
      if (result.markedCount > 0) {
        results.push({
          date: date.toDateString(),
          markedCount: result.markedCount
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          start: startDate,
          end: endDate,
          excludeWeekends
        },
        totalActiveEmployees: activeEmployees.length,
        totalAbsentMarked: totalMarked,
        results
      },
      message: `Marked ${totalMarked} absent records for the date range`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Calculate department statistics
const calculateDepartmentStats = (attendanceRecords, departmentEmployees) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  const todayAttendance = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= today && recordDate < tomorrow;
  });
  
  const stats = {
    totalEmployees: departmentEmployees.length,
    totalRecords: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'present').length,
    late: attendanceRecords.filter(a => a.status === 'late').length,
    absent: attendanceRecords.filter(a => a.status === 'absent').length,
    autoAbsent: attendanceRecords.filter(a => a.status === 'absent' && a.autoMarked).length,
    on_leave: attendanceRecords.filter(a => a.status === 'on_leave').length,
    system_auto: attendanceRecords.filter(a => a.status === 'system-auto').length,
    todayPresent: todayAttendance.filter(a => a.status === 'present').length,
    todayLate: todayAttendance.filter(a => a.status === 'late').length,
    todayAbsent: todayAttendance.filter(a => a.status === 'absent').length,
    todayOnLeave: todayAttendance.filter(a => a.status === 'on_leave').length,
    todayPendingClockOut: todayAttendance.filter(a => a.clockIn && !a.clockOut && (a.status === 'present' || a.status === 'late')).length,
    todayTotal: todayAttendance.length
  };
  
  return stats;
};

// Get attendance for HOD's department
const getHodDepartmentAttendance = async (req, res) => {
  try {
    const hodEmployee = await Employee.findOne({ user: req.user.id })
      .populate('department', 'name code');
    
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
    
    const hodDepartmentId = hodEmployee.department._id;
    const departmentName = hodEmployee.department.name;
    
    const {
      startDate,
      endDate,
      status,
      employeeCode,
      employeeId,
      page = 1,
      limit = 50,
      showOnlyPendingClockOut = false,
      showOnlyToday = false
    } = req.query;
    
    const departmentEmployees = await Employee.find({ 
      department: hodDepartmentId,
      status: "active"
    }).select("_id firstname lastname employeeCode position department jobTitle");
    
    const departmentEmployeeIds = departmentEmployees.map(emp => emp._id);
    
    const query = {
      employee: { $in: departmentEmployeeIds }
    };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    if (showOnlyToday === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    }
    
    if (status) {
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        query.status = { $in: statuses };
      } else {
        query.status = status;
      }
    }
    
    if (employeeCode) {
      const employee = await Employee.findOne({ 
        employeeCode: employeeCode.trim(),
        department: hodDepartmentId 
      }).select("_id");
      if (employee) {
        query.employee = employee._id;
      } else {
        return res.status(200).json({
          success: true,
          data: {
            department: {
              _id: hodDepartmentId,
              name: departmentName,
              code: hodEmployee.department.code,
              hod: {
                name: `${hodEmployee.firstname} ${hodEmployee.lastname}`,
                employeeCode: hodEmployee.employeeCode
              }
            },
            attendance: [],
            employees: departmentEmployees,
            stats: calculateDepartmentStats([], departmentEmployees),
            message: `No employee with code ${employeeCode} found in ${departmentName} department`
          }
        });
      }
    }
    
    if (employeeId) {
      const employee = await Employee.findOne({ 
        _id: employeeId,
        department: hodDepartmentId 
      });
      if (employee) {
        query.employee = employeeId;
      } else {
        return res.status(200).json({
          success: true,
          data: {
            department: {
              _id: hodDepartmentId,
              name: departmentName,
              hod: {
                name: `${hodEmployee.firstname} ${hodEmployee.lastname}`,
                employeeCode: hodEmployee.employeeCode
              }
            },
            attendance: [],
            employees: departmentEmployees,
            stats: calculateDepartmentStats([], departmentEmployees),
            message: "Employee not found in your department"
          }
        });
      }
    }
    
    if (showOnlyPendingClockOut === 'true') {
      query.clockIn = { $ne: null };
      query.clockOut = null;
      query.status = { $in: ['present', 'late'] };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const attendance = await AttendanceLog.find(query)
      .sort({ date: -1, clockIn: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "employee",
        select: "firstname lastname employeeCode email department jobTitle position photo",
        populate: {
          path: "department",
          select: "name code"
        }
      });
    
    const total = await AttendanceLog.countDocuments(query);
    
    const statsQuery = { ...query };
    delete statsQuery.skip;
    delete statsQuery.limit;
    
    const allStatsRecords = await AttendanceLog.find(statsQuery);
    const stats = calculateDepartmentStats(allStatsRecords, departmentEmployees);
    
    res.status(200).json({
      success: true,
      data: {
        department: {
          _id: hodDepartmentId,
          name: departmentName,
          code: hodEmployee.department.code
        },
        hod: {
          name: `${hodEmployee.firstname} ${hodEmployee.lastname}`,
          employeeCode: hodEmployee.employeeCode,
          email: hodEmployee.email,
          position: hodEmployee.position
        },
        attendance,
        employees: departmentEmployees,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: `Attendance data for ${departmentName} department`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching department attendance",
      error: error.message
    });
  }
};

// Get today's summary for HOD's department
const getHodTodaySummary = async (req, res) => {
  try {
    const hodEmployee = await Employee.findOne({ user: req.user.id })
      .populate('department', 'name code');
    
    if (!hodEmployee || !hodEmployee.department) {
      return res.status(403).json({ 
        success: false, 
        message: "HOD department information not found" 
      });
    }
    
    const hodDepartmentId = hodEmployee.department._id;
    const departmentName = hodEmployee.department.name;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const departmentEmployees = await Employee.find({ 
      department: hodDepartmentId,
      status: "active"
    }).select("_id firstname lastname employeeCode position");
    
    const departmentEmployeeIds = departmentEmployees.map(emp => emp._id);
    
    const attendanceToday = await AttendanceLog.find({
      employee: { $in: departmentEmployeeIds },
      date: { $gte: today, $lt: tomorrow }
    }).populate({
      path: "employee",
      select: "firstname lastname employeeCode department position",
      populate: {
        path: "department",
        select: "name"
      }
    });
    
    const summary = {
      date: today.toDateString(),
      department: {
        id: hodDepartmentId,
        name: departmentName,
        code: hodEmployee.department.code
      },
      totalEmployees: departmentEmployees.length,
      present: attendanceToday.filter(a => a.status === 'present').length,
      late: attendanceToday.filter(a => a.status === 'late').length,
      absent: attendanceToday.filter(a => a.status === 'absent').length,
      autoAbsent: attendanceToday.filter(a => a.status === 'absent' && a.autoMarked).length,
      on_leave: attendanceToday.filter(a => a.status === 'on_leave').length,
      system_auto: attendanceToday.filter(a => a.status === 'system-auto').length,
      pendingClockOut: attendanceToday.filter(a => a.clockIn && !a.clockOut && (a.status === 'present' || a.status === 'late')).length,
      clockedIn: attendanceToday.filter(a => a.clockIn && (a.status === 'present' || a.status === 'late')).length,
      clockedOut: attendanceToday.filter(a => a.clockOut && (a.status === 'present' || a.status === 'late')).length,
      attendanceRate: departmentEmployees.length > 0 ? 
        ((attendanceToday.filter(a => a.status === 'present' || a.status === 'late').length) / departmentEmployees.length * 100).toFixed(1) : 0,
      leaveRate: departmentEmployees.length > 0 ? 
        ((attendanceToday.filter(a => a.status === 'on_leave').length) / departmentEmployees.length * 100).toFixed(1) : 0,
      absenceRate: departmentEmployees.length > 0 ? 
        ((attendanceToday.filter(a => a.status === 'absent').length) / departmentEmployees.length * 100).toFixed(1) : 0
    };
    
    const employeesOnLeave = attendanceToday
      .filter(a => a.status === 'on_leave')
      .map(record => ({
        name: `${record.employee?.firstname} ${record.employee?.lastname}`,
        employeeCode: record.employee?.employeeCode,
        position: record.employee?.position
      }));
    
    const employeesAbsent = attendanceToday
      .filter(a => a.status === 'absent')
      .map(record => ({
        name: `${record.employee?.firstname} ${record.employee?.lastname}`,
        employeeCode: record.employee?.employeeCode,
        position: record.employee?.position,
        autoMarked: record.autoMarked
      }));
    
    res.status(200).json({
      success: true,
      data: {
        summary,
        attendanceToday,
        employeesOnLeave,
        employeesAbsent,
        totalRecords: attendanceToday.length,
        timestamp: new Date()
      },
      message: `Today's attendance summary for ${departmentName} department`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching today's summary",
      error: error.message
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  verifyEmployeeCode,
  getAllAttendance,
  getAttendanceById,
  getEmployeeAttendance,
  updateAttendance,
  deleteAttendance,
  markAbsentAutomatically,
  getTodaySummary,
  markAbsentForDateRange,
  getHodDepartmentAttendance,
  getHodTodaySummary
};