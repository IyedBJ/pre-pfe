const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ref: { type: String },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  clientDolibarrId: { type: String }, 
  clientName: { type: String },         
  tjm: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['En cours', 'Terminé', 'En pause', 'Annulé'],
    default: 'En cours',
  },
  marge: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
