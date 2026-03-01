const Department = require("../models/Department");
const Organisation = require("../models/Organisation");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

// Create new department
const createDepartment = async (req, res) => {
    try {
        const { departmentId, name, code, organisation, description } = req.body;

        if (!departmentId || !name || !code || !organisation) {
            return res.status(400).json({ 
                message: "Department ID, name, code, and organisation are required" 
            });
        }

        // Check unique department code
        const existingCode = await Department.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ 
                message: "Department code already exists" 
            });
        }

        // Check unique department name
        const existingName = await Department.findOne({ name });
        if (existingName) {
            return res.status(400).json({ 
                message: "Department name already exists" 
            });
        }

        // Resolve organisation (by name or ID)
        let organisationId = organisation;

        if (typeof organisation === "string" && !mongoose.Types.ObjectId.isValid(organisation)) {
            const org = await Organisation.findOne({
                $or: [{ name: organisation }, { email: organisation }]
            });

            if (!org) {
                return res.status(404).json({ 
                    message: `Organisation "${organisation}" not found. Please create it first.` 
                });
            }

            organisationId = org._id;
        } else if (!mongoose.Types.ObjectId.isValid(organisation)) {
            return res.status(400).json({ 
                message: "Invalid organisation format" 
            });
        }

        const organisationExists = await Organisation.findById(organisationId);
        if (!organisationExists) {
            return res.status(404).json({ 
                message: "Organisation not found" 
            });
        }

        // Create department
        const department = new Department({
            departmentId,
            name,
            code: code.toUpperCase(),
            organisation: organisationId,
            description: description || ""
        });

        await department.save();

        // Populate organisation info in response
        const populatedDepartment = await Department.findById(department._id)
            .populate("organisation", "name email");

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department: {
                id: populatedDepartment._id,
                departmentId: populatedDepartment.departmentId,
                name: populatedDepartment.name,
                code: populatedDepartment.code,
                description: populatedDepartment.description,
                organisation: {
                    id: populatedDepartment.organisation._id,
                    name: populatedDepartment.organisation.name,
                    email: populatedDepartment.organisation.email
                }
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "Department code or name already exists" 
            });
        }

        res.status(500).json({ 
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all departments
const getAllDepartments = async (req,res) => {
    try {
        const departments = await Department.find()
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

// Get single department
const getSingleDepartment = async (req,res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json(department);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

// Update department
const updateDepartment = async (req,res) => {
    try {
        const updatedDepartment = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedDepartment) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json({
            message: "Department updated successfully",
            department: updatedDepartment
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

// Delete department
const deleteDepartment = async (req,res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json({ message: "Department deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    createDepartment,
    getAllDepartments,
    deleteDepartment,
    updateDepartment
};