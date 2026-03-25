const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', async (req, res) => {
  const employee = new Employee({
    IdEmp: req.body.IdEmp || `EMP-${Date.now()}`,
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    client: req.body.client,
    tjm: req.body.tjm,
    status: req.body.status || "Neutre",
    avatar: req.body.avatar
  });

  try {
    const newEmployee = await employee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error("Erreur detaillée POST /api/employees:", err);
    res.status(400).json({ message: err.message, detailedError: err });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Salarié non trouvé' });
    res.json({ message: 'Salarié supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        client: req.body.client,
        tjm: req.body.tjm,
        status: req.body.status,
        avatar: req.body.avatar
      },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) return res.status(404).json({ message: 'Salarié non trouvé' });
    res.json(updatedEmployee);
  } catch (err) {
    console.error("Erreur detaillée PUT /api/employees/:id:", err);
    res.status(400).json({ message: err.message, detailedError: err });
  }
});

module.exports = router;
