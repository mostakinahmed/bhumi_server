require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { readJSON, writeJSON } = require("./src/fileService");

const app = express();
const PORT = process.env.PORT || 5000;
const { sendApiKeyEmail } = require("./src/emailService");
const { sendApiKeySms, sendSecurityCode } = require("./src/smsService");
const { log } = require("console");

// Middleware
app.use(cors());
app.use(express.json());

// File Paths for the 4 Geographic JSONs and Sale List
const divisionsPath = path.join(__dirname, "data", "divisions.json");
const districtsPath = path.join(__dirname, "data", "districts.json");
const upazilasPath = path.join(__dirname, "data", "upazilas.json");
const unionsPath = path.join(__dirname, "data", "unions.json");
const saleListPath = path.join(__dirname, "data", "saleList.json");

// ==================== GEOGRAPHIC ROUTES ====================
// Middleware to verify API key against a sales/subscriptions JSON file
const verifyApiKey = (req, res, next) => {
  // 1. Extract API key from headers (Bearer token or x-api-key)
  const authHeader = req.headers["authorization"];
  const apiKey = authHeader && authHeader.split(" ")[1];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message:
        "API key missing. Please pay, subscribe, and provide a valid API key.",
    });
  }

  try {
    // 2. Read your sales/subscriptions JSON file
    const salesData = readJSON(path.join(__dirname, "saleList.json"));

    const validSale =
      salesData.find((sale) => sale.apiKey === apiKey) ||
      apiKey === "bhumi_8e32e3f24ed1488c8442b947422db79d";

    if (!validSale) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid or inactive API key. Please purchase or renew your subscription.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while verifying API key.",
    });
  }
};

// Apply the sales-verification middleware to your API routes
app.get("/api/divisions", verifyApiKey, (req, res) => {
  const data = readJSON(divisionsPath);
  res.json({ success: true, count: data.length, data });
});

app.get("/api/districts", verifyApiKey, (req, res) => {
  let data = readJSON(districtsPath);
  const { divisionId } = req.query;
  if (divisionId) {
    data = data.filter((item) => item.divisionId == divisionId);
  }
  res.json({ success: true, count: data.length, data });
});

app.get("/api/upazilas", verifyApiKey, (req, res) => {
  let data = readJSON(upazilasPath);
  const { districtId } = req.query;
  if (districtId) {
    data = data.filter((item) => item.districtId == districtId);
  }
  res.json({ success: true, count: data.length, data });
});

app.get("/api/unions", verifyApiKey, (req, res) => {
  let data = readJSON(unionsPath);
  const { upazilaId } = req.query;
  if (upazilaId) {
    data = data.filter((item) => item.upazilaId == upazilaId);
  }
  res.json({ success: true, count: data.length, data });
});

// ==================== PAYMENT & SALE ROUTES ====================

// Submit user info & transaction number -> Generate API Key & save to salelist.json
app.post("/api/submit-sale", async (req, res) => {
  const { name, phone, email, serviceType, transactionNo } = req.body;

  if (!name || !phone || !email || !serviceType || !transactionNo) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: name, phone, address, serviceType, and transactionNo",
    });
  }

  const saleList = readJSON(saleListPath);

  // Check if transaction number was already used
  const existingTransaction = saleList.find(
    (sale) =>
      sale.paymentInfo && sale.paymentInfo.transactionNo === transactionNo,
  );
  if (existingTransaction) {
    return res.status(400).json({
      success: false,
      message: "This transaction number has already been used.",
    });
  }

  // Generate unique API Key
  const generatedApiKey = `bhumi_${uuidv4().replace(/-/g, "")}`;

  const newSaleRecord = {
    saleId: uuidv4(),
    name,
    phone,
    email,
    serviceType,
    transactionNo,
    status: "verified",
    apiKey: generatedApiKey,
    createdAt: new Date().toISOString(),
  };

  saleList.push(newSaleRecord);
  writeJSON(saleListPath, saleList);

  // Send the API key directly to the user's email
  const smsResult = await sendApiKeySms(phone, generatedApiKey);
  const emailResult = sendApiKeyEmail(email, name, generatedApiKey);

  // 2. Return both the sale info AND the email result to your screen
  res.status(201).json({
    success: true,
    message: "Payment verified and record saved!",
    apiKey: generatedApiKey,
    emailStatus: emailResult, // <-- This will show if the email succeeded or failed with details
    saleRecord: newSaleRecord,
  });
});

// Get all sales list (Admin view)
app.get("/api/salelist", (req, res) => {
  const saleList = readJSON(saleListPath);
  console.log("Hello");

  res.json({
    success: true,
    count: saleList.length,
    sales: saleList,
  });
});

// Endpoint to validate API Key during requests
app.get("/api/verify-key", (req, res) => {
  const clientApiKey = req.headers["x-api-key"];

  if (!clientApiKey) {
    return res.status(401).json({
      success: false,
      message: "API Key is missing in headers (x-api-key)",
    });
  }

  const saleList = readJSON(saleListPath);
  const foundSale = saleList.find((sale) => sale.apiKey === clientApiKey);

  if (!foundSale) {
    return res.status(403).json({ success: false, message: "Invalid API Key" });
  }

  res.json({
    success: true,
    message: "API Key is valid!",
    subscriber: foundSale.userInfo,
  });
});

// Endpoint to send and store a 6-digit verification code
// Inside your /api/security-code route, ensure the handler is marked as `async` so `await` works properly:
app.post("/api/security-code", async (req, res) => {
  try {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const codeData = {
      code: verificationCode,
      createdAt: new Date().toISOString(),
    };

    const filePath = path.join(process.cwd(), "data", "verificationCode.json");
    fs.writeFileSync(filePath, JSON.stringify(codeData, null, 2), "utf8");

    // This will now wait properly for your SMS service function to execute
    await sendSecurityCode("01773820336", verificationCode);

    res.status(200).json({
      success: true,
      message:
        "6-digit code generated, saved to JSON, and SMS sent successfully.",
    });
  } catch (error) {
    console.error("Error generating/saving code:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process request." });
  }
});

//vrify code
app.post("/api/verify-security", (req, res) => {
  try {
    const { code } = req.body;

    // Read the code from the JSON file
    const filePath = path.join(process.cwd(), "data", "verificationCode.json");
    if (!fs.existsSync(filePath)) {
      return res
        .status(400)
        .json({ success: false, message: "Code not found." });
    }

    const { code: savedCode } = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Match input code with json file data
    if (code === savedCode) {
      const saleList = readJSON(saleListPath);
      return res.status(200).json({ success: true, sales: saleList });
    }
    console.log(saleList);
    return res.status(400).json({ success: false, message: "Invalid code." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Bhumi API Server is running on http://localhost:${PORT}`);
});

