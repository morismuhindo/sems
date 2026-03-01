const Employee = require("../models/Employee");
const User = require("../models/User");
const Department = require("../models/Department");
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const Organisation = require("../models/Organisation");
const EmployeeIDCard = require("../models/EmployeeIDCard");
const QRCode = require("qrcode");
const {sendWelcomeEmail, sendEmployeeCredentials} = require("../emailconfig/emailService");

// Generate employee code with department and name initial
const generateEmployeeCode = async (departmentId, firstName) => {
    try {
        const dept = await Department.findById(departmentId);
        if (!dept) throw new Error("Department not found");

        let deptCode = dept.code || dept.abbreviation || dept.name.substring(0, 3).toUpperCase();
        const nameInitial = firstName ? firstName.charAt(0).toUpperCase() : 'X';
        const baseCode = `${deptCode}${nameInitial}`;
        
        const existingEmployees = await Employee.find({
            employeeCode: { $regex: `^${baseCode}\\d+$` }
        }).select('employeeCode');
        
        let maxSerial = 0;
        
        existingEmployees.forEach(emp => {
            const match = emp.employeeCode.match(/\d+$/);
            if (match) {
                const serialNum = parseInt(match[0]);
                if (serialNum > maxSerial) {
                    maxSerial = serialNum;
                }
            }
        });
        
        const nextSerial = maxSerial + 1;
        const serial = String(nextSerial).padStart(3, "0");
        return `${baseCode}${serial}`;
    } catch (error) {
        throw error;
    }
};

// Check if card number exists
const checkCardNumberExists = async (cardNumber) => {
    const cardExists = await EmployeeIDCard.findOne({ cardNumber });
    return !!cardExists;
};

// Generate alternative card number
const generateAlternativeCardNumber = async (baseCode) => {
    const deptCode = baseCode.match(/^[A-Z]+/)?.[0] || "EMP";
    const nameInitial = baseCode.match(/[A-Z](?=\d{3}$)/)?.[0] || "X";
    
    const existingCards = await EmployeeIDCard.find({
        cardNumber: { $regex: `^${deptCode}${nameInitial}\\d+$` }
    }).select('cardNumber');
    
    let maxCounter = 0;
    
    existingCards.forEach(card => {
        const match = card.cardNumber.match(/\d+$/);
        if (match) {
            const counterNum = parseInt(match[0]);
            if (counterNum > maxCounter) {
                maxCounter = counterNum;
            }
        }
    });
    
    let counter = maxCounter + 1;
    
    while (counter < 1000) {
        const altCode = `${deptCode}${nameInitial}${String(counter).padStart(3, "0")}`;
        
        const cardExists = await checkCardNumberExists(altCode);
        if (!cardExists) {
            return altCode;
        }
        counter++;
    }
    
    return `${deptCode}${nameInitial}${Date.now().toString().slice(-6)}`;
};

// Extract photo URL from employee object
const extractPhotoUrl = (photoData) => {
    if (!photoData) return null;
    
    if (typeof photoData === 'string') {
        return photoData;
    }
    
    if (photoData.url) {
        return photoData.url;
    }
    
    if (photoData.path) {
        // Convert path to URL format (frontend expects /uploads/... format)
        if (photoData.path.includes('uploads')) {
            const match = photoData.path.match(/uploads.*/);
            if (match) {
                return `/${match[0]}`;
            }
        }
        return photoData.path;
    }
    
    return null;
};


const autoGenerateIDCard = async (employee) => {
    try {
        const existingCard = await EmployeeIDCard.findOne({ employee: employee._id });
        if (existingCard) {
            return existingCard;
        }

        const duplicateCard = await EmployeeIDCard.findOne({ cardNumber: employee.employeeCode });
        if (duplicateCard) {
            const newCardNumber = await generateAlternativeCardNumber(employee.employeeCode);
            
            const updatedEmployee = await Employee.findByIdAndUpdate(
                employee._id, 
                { employeeCode: newCardNumber },
                { new: true }
            );
            
            return { idCard: null, updatedEmployee };
        }

        const [department, organisation] = await Promise.all([
            Department.findById(employee.department).select('name code'),
            Organisation.findById(employee.organisation).select('name')
        ]);

        const qrData = {
            employeeCode: employee.employeeCode,
            name: `${employee.firstname} ${employee.lastname}`,
            department: department?.name || "N/A",
            organisation: organisation?.name || "N/A",
            jobTitle: employee.jobTitle || "N/A",
            issueDate: new Date().toISOString().split('T')[0]
        };

        let qrCodeBase64 = "";
        try {
            qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 250
            });
        } catch (qrError) {
            qrCodeBase64 = await QRCode.toDataURL(`EMP:${employee.employeeCode}`);
        }

        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        // FIX: Extract photo URL properly before saving to ID card
        const employeePhotoUrl = extractPhotoUrl(employee.photo);

        const idCard = new EmployeeIDCard({
            employee: employee._id,
            cardNumber: employee.employeeCode,
            issueDate,
            expiryDate,
            qrCode: qrCodeBase64,
            photo: employeePhotoUrl, // Now using extracted photo URL
            status: "active"
        });

        await idCard.save();
        return { idCard, updatedEmployee: null };

    } catch (error) {
        if (error.code === 11000) {
            try {
                const altCode = await generateAlternativeCardNumber(employee.employeeCode);
                
                const updatedEmployee = await Employee.findByIdAndUpdate(
                    employee._id, 
                    { employeeCode: altCode },
                    { new: true }
                );
                
                return await autoGenerateIDCard(updatedEmployee);
            } catch (retryError) {
                return { idCard: null, updatedEmployee: null };
            }
        }
        
        return { idCard: null, updatedEmployee: null };
    }
};

//Create new employee 
const createEmployee = async (req, res) => {
    try {
        const { firstname, lastname, gender, dateOfBirth, phone, email, address, 
                photo, role, organisation, department, jobTitle, employmentType, 
                hireDate, salaryBase, password } = req.body;

        if (!firstname || !lastname || !department || !organisation) {
            return res.status(400).json({
                success: false,
                message: "Firstname, lastname, department, and organisation are required"
            });
        }

        let departmentId = department;
        if (typeof department === 'string' && !mongoose.Types.ObjectId.isValid(department)) {
            const dept = await Department.findOne({ name: department });
            if (!dept) {
                return res.status(404).json({
                    success: false,
                    message: `Department "${department}" not found`
                });
            }
            departmentId = dept._id;
        } else if (!mongoose.Types.ObjectId.isValid(department)) {
            return res.status(400).json({
                success: false,
                message: "Invalid department format"
            });
        }

        let organisationId = organisation;
        if (typeof organisation === 'string' && !mongoose.Types.ObjectId.isValid(organisation)) {
            const org = await Organisation.findOne({ name: organisation });
            if (!org) {
                return res.status(404).json({
                    success: false,
                    message: "Organisation not found"
                });
            }
            organisationId = org._id;
        }

        let employeeRole = role || 'employee';
        const validRoles = ['hod', 'attendanceManager', 'employee', 'hr'];
        if (role && !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
            });
        }
        employeeRole = employeeRole.toLowerCase();

        const [deptExists, orgExists] = await Promise.all([
            Department.findById(departmentId),
            Organisation.findById(organisationId)
        ]);
        
        if (!deptExists || !orgExists) {
            return res.status(404).json({
                success: false,
                message: !deptExists ? "Department not found" : "Organisation not found"
            });
        }

        let employeeCode = await generateEmployeeCode(departmentId, firstname);

        if (email) {
            const emailExists = await Employee.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }

        if (phone) {
            const phoneExists = await Employee.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number already exists"
                });
            }
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let employeePhoto = photo || null;

        if (req.file) {
            employeePhoto = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                url: `/uploads/${req.file.filename}`
            };
        }

        const newEmployee = new Employee({
            employeeCode,
            firstname,
            lastname,
            gender: gender || "Did not Indicate",
            dateOfBirth: dateOfBirth || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            photo: employeePhoto,
            role: employeeRole,
            organisation: organisationId,
            department: departmentId,
            jobTitle: jobTitle || null,
            employmentType: employmentType || "full-time",
            hireDate: hireDate || new Date(),
            salaryBase: salaryBase || 0,
            password: hashedPassword,
            status: "active"
        });

        await newEmployee.save();

        const idCardResult = await autoGenerateIDCard(newEmployee);
        const { idCard, updatedEmployee } = idCardResult;
        const finalEmployee = updatedEmployee || newEmployee;

        if (email) {
            try {
                const emailService = require("../emailconfig/emailService");
                const org = await Organisation.findById(organisationId);
                
                await emailService.sendWelcomeEmail(
                    email, 
                    `${firstname} ${lastname}`, 
                    org.name, 
                    employeeRole
                );
                
                if (password) {
                    await emailService.sendEmployeeCredentials(
                        email,
                        `${firstname} ${lastname}`,
                        finalEmployee.employeeCode, 
                        password, 
                        org.name,
                        employeeRole
                    );
                }
            } catch (emailError) {
            }
        }
        
        const [deptDetails, orgDetails] = await Promise.all([
            Department.findById(departmentId).select('name code abbreviation'),
            Organisation.findById(organisationId).select('name logo address')
        ]);
        
        const responseData = {
            id: finalEmployee._id,
            employeeCode: finalEmployee.employeeCode,
            firstname: finalEmployee.firstname,
            lastname: finalEmployee.lastname,
            fullName: `${finalEmployee.firstname} ${finalEmployee.lastname}`,
            email: finalEmployee.email,
            phone: finalEmployee.phone,
            photo: extractPhotoUrl(finalEmployee.photo),
            role: finalEmployee.role,
            department: deptDetails ? {
                id: deptDetails._id,
                name: deptDetails.name,
                code: deptDetails.code,
                abbreviation: deptDetails.abbreviation
            } : null,
            organisation: orgDetails ? {
                id: orgDetails._id,
                name: orgDetails.name,
                logo: orgDetails.logo,
                address: orgDetails.address
            } : null,
            jobTitle: finalEmployee.jobTitle,
            employmentType: finalEmployee.employmentType,
            hireDate: finalEmployee.hireDate,
            status: finalEmployee.status,
            createdAt: finalEmployee.createdAt,
            idCard: idCard ? {
                cardNumber: idCard.cardNumber,
                issueDate: idCard.issueDate,
                expiryDate: idCard.expiryDate,
                status: idCard.status,
                hasPhoto: !!idCard.photo,
                qrCodeGenerated: !!idCard.qrCode,
                photo: extractPhotoUrl(idCard.photo) // ADDED: Include photo in response
            } : null
        };

        res.status(201).json({
            success: true,
            message: "Employee created successfully" + (idCard ? " with ID card" : ""),
            data: responseData
        });

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            return res.status(400).json({
                success: false,
                message: `${field} "${value}" already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};














// Get all employees - ADDED photo extraction
const allEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate({
        path: 'department',
        select: 'name code', 
      });
    
    // FIX: Extract photo URLs for response
    const processedEmployees = employees.map(emp => ({
      ...emp.toObject(),
      photo: extractPhotoUrl(emp.photo)
    }));
    
    res.status(200).json({ employees: processedEmployees });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single employee - ADDED photo extraction
const singleEmployee = async (req,res) => {
    try{
        const employee = await Employee.findById(req.params.id);
          
        if (!employee) return res.status(404).json({ message: "Employee not found" });
        
        // FIX: Extract photo URL for response
        const processedEmployee = {
            ...employee.toObject(),
            photo: extractPhotoUrl(employee.photo)
        };
        
        res.json(processedEmployee);

    }catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

// Update employee - ADDED photo extraction
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                message: "Employee ID is required" 
            });
        }

        if (req.file) {
            updatedData.photo = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                url: `/uploads/${req.file.filename}` // ADDED: Ensure URL is set
            };
        }

        const employee = await Employee.findByIdAndUpdate(
            id, 
            updatedData, 
            { 
                new: true,
                runValidators: true
            }
        );
        
        if (!employee) {
            return res.status(404).json({ 
                message: "Employee not found" 
            });
        }
        
        // FIX: Extract photo URL for response
        const processedEmployee = {
            ...employee.toObject(),
            photo: extractPhotoUrl(employee.photo)
        };
        
        res.status(200).json({ 
            message: "Employee updated successfully", 
            employee: processedEmployee 
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Server error",
            error: error.message 
        });
    }
};

// Delete employee
const deleteEmployee = async (req,res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        if (employee.user) {
            await User.findByIdAndDelete(employee.user);
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

// Get employees in HOD's department
const getMyDepartmentEmployees = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID not found in token" 
      });
    }

    // First, get the user to check role
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if user is HOD (role is stored in User model)
    if (user.role !== 'hod') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Only HODs can view department employees" 
      });
    }

    // Find the HOD's employee profile (linked by user._id or email)
    let hodEmployee = await Employee.findOne({ user: userId });
    
    // If no direct link by user ID, try to find by email
    if (!hodEmployee && user.email) {
      hodEmployee = await Employee.findOne({ email: user.email });
      
      // If found by email, link the user to employee
      if (hodEmployee) {
        hodEmployee.user = userId;
        await hodEmployee.save();
      }
    }

    if (!hodEmployee) {
      return res.status(404).json({ 
        success: false,
        message: "HOD employee profile not found. Please contact HR to set up your employee profile." 
      });
    }

    // Get HOD's department
    const departmentId = hodEmployee.department;
    
    if (!departmentId) {
      return res.status(400).json({ 
        success: false,
        message: "HOD does not have an assigned department" 
      });
    }

    // Get department details
    const department = await Department.findById(departmentId)
      .select('name code abbreviation');
    
    if (!department) {
      return res.status(404).json({ 
        success: false,
        message: "Department not found. Please contact HR." 
      });
    }

    // Find all employees in HOD's department (excluding the HOD themselves)
    const employees = await Employee.find({ 
      department: departmentId,
      _id: { $ne: hodEmployee._id }
    })
    .populate({
      path: 'department',
      select: 'name code abbreviation'
    })
    .populate({
      path: 'organisation',
      select: 'name'
    })
    .populate({
      path: 'user',
      select: 'name email role'
    })
    .select('-password')
    .sort({ createdAt: -1 });

    const response = {
      success: true,
      count: employees.length,
      department: {
        id: department._id,
        name: department.name,
        code: department.code,
        abbreviation: department.abbreviation
      },
      hodInfo: {
        id: hodEmployee._id,
        userId: hodEmployee.user,
        name: `${hodEmployee.firstname} ${hodEmployee.lastname}`,
        email: hodEmployee.email,
        employeeCode: hodEmployee.employeeCode,
        role: hodEmployee.role,
        photo: extractPhotoUrl(hodEmployee.photo)
      },
      employees: employees.map(emp => ({
        id: emp._id,
        userId: emp.user,
        employeeCode: emp.employeeCode,
        firstname: emp.firstname,
        lastname: emp.lastname,
        fullName: `${emp.firstname} ${emp.lastname}`,
        email: emp.email,
        phone: emp.phone,
        photo: extractPhotoUrl(emp.photo),
        role: emp.role,
        department: emp.department ? {
          id: emp.department._id,
          name: emp.department.name,
          code: emp.department.code,
          abbreviation: emp.department.abbreviation
        } : null,
        organisation: emp.organisation ? {
          id: emp.organisation._id,
          name: emp.organisation.name
        } : null,
        jobTitle: emp.jobTitle,
        employmentType: emp.employmentType,
        hireDate: emp.hireDate,
        status: emp.status,
        user: emp.user ? {
          id: emp.user._id,
          name: emp.user.name,
          email: emp.user.email,
          role: emp.user.role
        } : null
      }))
    };
    
    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching department employees:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
    createEmployee,
    allEmployees,
    singleEmployee,
    updateEmployee,
    deleteEmployee,
    getMyDepartmentEmployees,

};
