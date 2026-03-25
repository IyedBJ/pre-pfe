const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const username = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || "admin";

if (!username || !password) {
  console.log("Usage: node set_local_password.js <username> <password> [role]");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connecté à MongoDB");
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.findOneAndUpdate(
      { username: username },
      { 
        username: username,
        password: hashedPassword,
        role: role
      },
      { upsert: true, new: true }
    );

    process.exit(0);
  })
  .catch(err => {
    console.error("Erreur:", err);
    process.exit(1);
  });
