const axios = require("axios");
const sendApiKeySms = async (customerPhone, key) => {
  try {
    // 1. Clean and normalize number
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("880")) {
      cleanNumber = cleanNumber.substring(3); // Fix: 880 is 3 digits
    } else if (cleanNumber.startsWith("88")) {
      cleanNumber = cleanNumber.substring(2);
    }

    if (!cleanNumber.startsWith("0")) {
      cleanNumber = "0" + cleanNumber;
    }

    const message = `Your Bhumi API key is ready! Api key: ${key}. Keep it safe and do not share it publicly.`;

    // 2. API Call
    const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
      params: {
        api_key: process.env.BULKSMS_API_KEY,
        type: "text",
        number: cleanNumber,
        senderid: process.env.BULKSMS_SENDER_ID,
        message: message,
      },
    });

    // 4. Terminal Debugging
    console.log("RAW GATEWAY DATA (OTP):", response.data);
    const statusCode = response.data.response_code; // Usually response_code in BulkSMSBD

    if (statusCode === 202) {
      console.log("✅ Order SMS Sent Successfully to:", cleanNumber);
    } else {
      console.error(
        `❌ Order SMS Failed. Code ${statusCode}: ${response.data.error_message}`,
      );
    }

    return response.data;
  } catch (error) {
    console.error("❌ OTP SMS Function Error:", error.message);
    return { success: false, error: error.message };
  }
};

const sendSecurityCode = async (customerPhone, key) => {
  try {
    // 1. Clean and normalize number
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("880")) {
      cleanNumber = cleanNumber.substring(3); // Fix: 880 is 3 digits
    } else if (cleanNumber.startsWith("88")) {
      cleanNumber = cleanNumber.substring(2);
    }

    if (!cleanNumber.startsWith("0")) {
      cleanNumber = "0" + cleanNumber;
    }

    const message = `Your Bhumi security code is: ${key}. Keep it safe and do not share it publicly.`;

    // 2. API Call
    const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
      params: {
        api_key: process.env.BULKSMS_API_KEY,
        type: "text",
        number: cleanNumber,
        senderid: process.env.BULKSMS_SENDER_ID,
        message: message,
      },
    });

    // 4. Terminal Debugging
    console.log("RAW GATEWAY DATA (OTP):", response.data);
    const statusCode = response.data.response_code; // Usually response_code in BulkSMSBD

    if (statusCode === 202) {
      console.log("✅ Order SMS Sent Successfully to:", cleanNumber);
    } else {
      console.error(
        `❌ Order SMS Failed. Code ${statusCode}: ${response.data.error_message}`,
      );
    }

    return response.data;
  } catch (error) {
    console.error("❌ OTP SMS Function Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendApiKeySms, sendSecurityCode };
