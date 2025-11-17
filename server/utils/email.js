const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ExpressKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: message,
      html: html || message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to ExpressKart! 🎉';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to ExpressKart!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your local shopping destination</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name}! 👋</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining ExpressKart! We're excited to have you as part of our community.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>🛍️ Browse products from local vendors</li>
            <li>📍 Discover shops near you</li>
            <li>🚚 Get fast local delivery</li>
            <li>⭐ Read and write reviews</li>
            <li>💳 Shop with secure payments</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/products" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            Start Shopping Now
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or need assistance, feel free to reach out to our support team.
        </p>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Best regards,<br>
            The ExpressKart Team
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

// Send email verification email
const sendVerificationEmail = async (user, token) => {
  const subject = 'Verify Your Email - ExpressKart';
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">ExpressKart Account Verification</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name}! 👋</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Please verify your email address to complete your ExpressKart account setup.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
        </p>
        
        <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all;">
          <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          This verification link will expire in 24 hours. If you didn't create an account with ExpressKart, 
          you can safely ignore this email.
        </p>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Best regards,<br>
            The ExpressKart Team
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
  const subject = 'Reset Your Password - ExpressKart';
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">ExpressKart Account Security</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name}! 👋</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          You requested to reset your password for your ExpressKart account.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If the button above doesn't work, you can copy and paste this link into your browser:
        </p>
        
        <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all;">
          <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Important:</p>
          <ul style="color: #856404; margin: 10px 0 0 0; padding-left: 20px;">
            <li>This link will expire in 10 minutes</li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>Your current password will remain unchanged</li>
          </ul>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Best regards,<br>
            The ExpressKart Team
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (user, order) => {
  const subject = `Order Confirmed - #${order.orderNumber}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Order #${order.orderNumber}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name}! 👋</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Great news! Your order has been confirmed and is being processed.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
          <p><strong>Order Number:</strong> #${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            View Order Details
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          We'll send you updates on your order status. Thank you for choosing ExpressKart!
        </p>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Best regards,<br>
            The ExpressKart Team
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};
