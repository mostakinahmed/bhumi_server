const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { readJSON, writeJSON } = require("./src/fileService");

const app = express();
const PORT = process.env.PORT || 5000;

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
app.post("/api/submit-sale", (req, res) => {
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

  res.status(201).json({
    success: true,
    message: "Payment verified and API key generated successfully!",
    apiKey: generatedApiKey,
    saleRecord: newSaleRecord,
  });
});

// Get all sales list (Admin view)
app.get("/api/salelist", (req, res) => {
  const saleList = readJSON(saleListPath);
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

// Start Server
app.listen(PORT, () => {
  console.log(`Bhumi API Server is running on http://localhost:${PORT}`);
});
