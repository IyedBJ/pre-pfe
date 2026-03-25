const express = require("express");
const router = express.Router();
const { loginAD } = require("../controllers/authController");

router.post("/login", loginAD);

module.exports = router;
