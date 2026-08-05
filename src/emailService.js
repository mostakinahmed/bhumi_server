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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Bhumi API</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                  
                  <!-- HEADER BANNER -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #1b3b2b 0%, #2c5e43 100%); padding: 35px 20px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Bhumi API Platform</h1>
                      <p style="color: #a3c9b8; margin: 8px 0 0 0; font-size: 14px;">Secure & Reliable Integration Services</p>
                    </td>
                  </tr>

                  <!-- BODY CONTENT -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1f2937; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Hello ${userName},</h2>
                      
                      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                        Thank you for your purchase! Your transaction has been successfully verified, and your dedicated API key has been generated and activated for use.
                      </p>

                      <!-- API KEY BOX -->
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2c5e43; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px;">Your Secret API Key</p>
                        <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 12px 15px; border-radius: 4px; font-family: monospace; font-size: 15px; color: #0f172a; word-break: break-all; font-weight: bold;">
                          ${apiKey}
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">Keep this key secure. Do not expose it in public repositories or client-side code.</p>
                      </div>

                      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                        <strong>How to use it:</strong> Include your API key in the request headers for all authorized endpoints:
                      </p>
                      
                      <div style="background-color: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; margin-bottom: 24px; line-height: 1.5;">
                        Authorization: Bearer YOUR_API_KEY<br/>
                        <span>// or</span><br/>
                        x-api-key: YOUR_API_KEY
                      </div>

                      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 0;">
                        If you have any questions or require technical assistance, feel free to reach out to our team.
                      </p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #64748b; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Mostakin Ahmed</p>
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Bhumi API Engineering Team</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: %s", info.messageId);
    return { success: true };
  } catch (error) {
    // Log the complete error details
    console.error("Detailed SMTP Error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    return { success: false, error: error.message };
  }
};

module.exports = { sendApiKeyEmail };
