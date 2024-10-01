const {Employee} = require("../models/index")
// create employee 
const createEmployee = async(req, res) => {
    try {
        if(!req.body || Object.keys(req.body).length === 0) return res.status(400).json({
            success: false,
            mes: "Missing input!"
        })
        const {email} = req.body
        const employeeExist = await Employee.findOne({email: email})
        if(employeeExist){
            throw new Error("Cannot create new employee!")
        }
        const newEmployee = await Employee.create(req.body)
        return res.status(200).json({
            success: newEmployee ? true : false,
            data: newEmployee ? newEmployee : "Cannot create new employee"
        })
    } catch (error) {
        throw new Error(error)
    }
}
module.exports = {
    createEmployee
}