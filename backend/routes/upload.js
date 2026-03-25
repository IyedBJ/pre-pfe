const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { extractFinancialData, extractZipData } = require("../controllers/financialController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), extractFinancialData);
router.post("/upload-zip", upload.single("file"), extractZipData);

module.exports = router;
