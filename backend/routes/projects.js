const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Employee = require('../models/Employee');

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('employeeId', 'name email role avatar tjm')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = new Project({
      title: req.body.title,
      ref: req.body.ref || `PRJ-${Date.now()}`,
      employeeId: req.body.employeeId,
      clientDolibarrId: req.body.clientDolibarrId,
      clientName: req.body.clientName,
      tjm: Number(req.body.tjm) || 0,
      status: req.body.status || 'En cours',
      marge: Number(req.body.marge) || 0,
    });
    const saved = await project.save();
    const populated = await saved.populate('employeeId', 'name email role avatar tjm');
    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /api/projects error:', err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        ref: req.body.ref,
        employeeId: req.body.employeeId,
        clientDolibarrId: req.body.clientDolibarrId,
        clientName: req.body.clientName,
        tjm: Number(req.body.tjm),
        status: req.body.status,
        marge: Number(req.body.marge),
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email role avatar tjm');

    if (!updated) return res.status(404).json({ message: 'Projet non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    res.json({ message: 'Projet supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
