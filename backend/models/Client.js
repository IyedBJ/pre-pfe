const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  dolibarrId: { type: String, unique: true, sparse: true },                        //car plusieurs null.sparse: ignore les documents sans valeur


  name: { type: String, required: true },
  email: { type: String },
  code_client: { type: String },
  projects: { type: Number, default: 0 },
  ca: { type: Number, default: 0 }, 
  latent: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ["Payé", "En attente", "En retard"],
    default: "En attente"
  },
  avatar: { type: String },
  bg: { type: String, default: "bg-blue-100" }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
