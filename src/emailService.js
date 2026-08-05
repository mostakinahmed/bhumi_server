const nodemailer = require("nodemailer");

// Create reusable transporter object using HostSheba SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendApiKeyEmail = async (userEmail, userName, apiKey) => {
  try {
    const mailOptions = {
      from: `"Bhumi API Support" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "Your API Key is Ready - Welcome to Bhumi API",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #24402F;">Welcome to Bhumi API, ${userName}!</h2>
          <p>Thank you for your purchase. Your transaction has been successfully verified, and your API key has been generated.</p>
          <p>You can use the following API key in your request headers (<code>Authorization: Bearer YOUR_API_KEY</code> or <code>x-api-key: YOUR_API_KEY</code>):</p>
          
          <div style="background: #f4f4f4; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; margin: 20px 0; word-break: break-all;">
            <b>${apiKey}</b>
          </div>
          
          <p>Keep your API key secure and do not share it publicly.</p>
          <br/>
          <p>Best regards,<br/><b>Mostakin Ahmed</b><br/>Bhumi API Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email via HostSheba SMTP:", error);
    return false;
  }
};

module.exports = { sendApiKeyEmail };
