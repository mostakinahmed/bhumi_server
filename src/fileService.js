const fs = require('fs');
const path = require('path');

const readJSON = (filePath) => {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        if (!fs.existsSync(fullPath)) return [];
        const data = fs.readFileSync(fullPath, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

const writeJSON = (filePath, data) => {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

module.exports = { readJSON, writeJSON };