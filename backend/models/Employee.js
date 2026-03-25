const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  IdEmp: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  role: { type: String },
  client: { type: String },
  tjm: { type: Number },
  status: { 
    type: String,
    enum: ["Rentable", "Perte", "Neutre"],
    default: "Neutre"
  },

  avatar:{ type: String },
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
