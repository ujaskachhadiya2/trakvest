const nodemailer = require("nodemailer");
require("dotenv").config();

// Debug: Log email configuration
console.log("Email Config:", {
  user: process.env.EMAIL_USER ? "Set" : "Not set",
  pass: process.env.EMAIL_PASS ? "Set" : "Not set"
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

function getEmailTemplate(type, userName) {
  const isRegistration = type === "registration";
  const title = isRegistration ? "Welcome to Trakvest!" : "Login Successful";
  const message = isRegistration 
    ? "Thank you for joining Trakvest. Your account has been successfully created."
    : "You have successfully logged into your Trakvest account.";
  const ctaText = isRegistration ? "Get Started" : "View Dashboard";
  const ctaLink = isRegistration ? "https://trakvest.com/getting-started" : "https://trakvest.com/dashboard";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background-color: #f5f7fa;
          font-family: "Arial", sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
          border-radius: 24px;
          box-shadow: 
            0 12px 24px rgba(26,35,126,0.1),
            0 4px 8px rgba(26,35,126,0.05);
          padding: 40px;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(26,35,126,0.1);
        }
        .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #1a237e, #3949ab, #1a237e);
          background-size: 200% 100%;
          animation: gradient 3s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo img {
          height: 40px;
          width: auto;
        }
        .title {
          color: #1a237e;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 24px;
          text-align: center;
          letter-spacing: -0.5px;
          line-height: 1.3;
        }
        .message {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 32px;
          text-align: center;
          padding: 0 20px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 16px 40px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          margin: 16px 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 12px rgba(26,35,126,0.2);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(26,35,126,0.3);
        }
        .footer {
          text-align: center;
          color: #718096;
          font-size: 14px;
          margin-top: 40px;
          padding: 20px;
          border-top: 1px solid rgba(26,35,126,0.1);
        }
        .social-links {
          text-align: center;
          margin: 32px 0;
          padding: 16px 0;
        }
        .social-link {
          display: inline-block;
          margin: 0 12px;
          color: #1a237e;
          text-decoration: none;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(26,35,126,0.05);
          transition: background 0.2s ease;
        }
        .social-link:hover {
          background: rgba(26,35,126,0.1);
        }
        .highlight-box {
          background: rgba(26,35,126,0.03);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          border: 1px solid rgba(26,35,126,0.08);
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(26,35,126,0.1), transparent);
          margin: 24px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        
        <div class="card">
          <h1 class="title">${title}</h1>
          <div class="highlight-box">
            <p class="message">${message}</p>
          </div>
          
          <div class="divider"></div>
          <div style="text-align: center; color: #4a5568; font-size: 14px;">
            <p>Need help? Contact our support team</p>
            <p style="margin-top: 8px;">
              <a href="mailto:trakvest@gmail.com" style="color: #1a237e; text-decoration: none;">support@trakvest.com</a>
            </p>
          </div>
        </div>
        <div class="social-links">
          <a href="https://facebook.com/trakvest" class="social-link">
            <span style="margin-right: 4px;">👍</span> Facebook
          </a>
          <a href="https://linkedin.com/company/trakvest" class="social-link">
            <span style="margin-right: 4px;">💼</span> LinkedIn
          </a>
        </div>
        <div class="footer">
          <p style="margin-bottom: 12px;">© ${new Date().getFullYear()} Trakvest. All rights reserved.</p>
          <p style="color: #a0aec0; font-size: 13px;">If you didn"t request this email, please ignore it or contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendConfirmationEmail(to, type = "registration") {
  let subject = type === "registration" ? "Welcome to Trakvest!" : "Login Successful";
  const userName = to.split("@")[0]; // Simple way to get username from email

  try {
    const info = await transporter.sendMail({
      from: `"Trakvest" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: getEmailTemplate(type, userName),
      text: type === "registration" 
        ? "Thank you for joining Trakvest. Your account has been successfully created."
        : "You have successfully logged into your Trakvest account."
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Detailed email error:", {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
}

module.exports = { sendConfirmationEmail };

