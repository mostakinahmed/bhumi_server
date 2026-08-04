const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File paths
const dataListPath = path.join(__dirname, 'data', 'datalist.json');
const saleListPath = path.join(__dirname, 'data', 'salelist.json');

// Helper Functions for JSON storage
const readJSON = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

const writeJSON = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

// ==================== ROUTES ====================

// 1. Get payment instructions & service data list
app.get('/api/datalist', (req, res) => {
    const dataList = readJSON(dataListPath);
    res.json({
        success: true,
        paymentInstructions: {
            method: "bKash / Nagad / Rocket (Send Money)",
            accountNumber: "01700000000",
            instruction: "Please Send Money to the number above and submit your transaction number along with your details."
        },
        data: dataList
    });
});

// 2. Submit user info & transaction number -> Generate API Key & save to salelist.json
app.post('/api/submit-sale', (req, res) => {
    const { name, phone, address, serviceType, transactionNo } = req.body;

    if (!name || !phone || !address || !serviceType || !transactionNo) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required: name, phone, address, serviceType, and transactionNo' 
        });
    }

    const saleList = readJSON(saleListPath);

    // Check if transaction number was already used
    const existingTransaction = saleList.find(sale => sale.paymentInfo && sale.paymentInfo.transactionNo === transactionNo);
    if (existingTransaction) {
        return res.status(400).json({
            success: false,
            message: 'This transaction number has already been used.'
        });
    }

    // Generate unique API Key
    const generatedApiKey = `bhumi_${uuidv4().replace(/-/g, '')}`;

    const newSaleRecord = {
        saleId: uuidv4(),
        paymentInfo: {
            transactionNo,
            status: 'verified'
        },
        userInfo: {
            name,
            phone,
            address,
            serviceType
        },
        apiKey: generatedApiKey,
        createdAt: new Date().toISOString()
    };

    saleList.push(newSaleRecord);
    writeJSON(saleListPath, saleList);

    res.status(201).json({
        success: true,
        message: 'Payment verified and API key generated successfully!',
        apiKey: generatedApiKey,
        saleRecord: newSaleRecord
    });
});

// 3. Get all sales list (Admin view)
app.get('/api/salelist', (req, res) => {
    const saleList = readJSON(saleListPath);
    res.json({
        success: true,
        count: saleList.length,
        sales: saleList
    });
});

// 4. Endpoint to validate API Key during requests
app.get('/api/verify-key', (req, res) => {
    const clientApiKey = req.headers['x-api-key'];

    if (!clientApiKey) {
        return res.status(401).json({ success: false, message: 'API Key is missing in headers (x-api-key)' });
    }

    const saleList = readJSON(saleListPath);
    const foundSale = saleList.find(sale => sale.apiKey === clientApiKey);

    if (!foundSale) {
        return res.status(403).json({ success: false, message: 'Invalid API Key' });
    }

    res.json({
        success: true,
        message: 'API Key is valid!',
        subscriber: foundSale.userInfo
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Bhumi API Server is running on http://localhost:${PORT}`);
});