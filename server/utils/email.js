// utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,  // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRecommendationEmail = async (to, subject, recommendations) => {
  try {
    const htmlContent = `
      <h1>New Research Recommendations</h1>
      <p>Based on your interests, here are new trials/research:</p>
      <ul>
        ${recommendations.map(rec => `<li>${rec.title} - ${rec.summary}</li>`).join('')}
      </ul>
      <p>If no new data: No updates this week. Check back soon!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
    // Handle gracefully: Log or notify admin
  }
};