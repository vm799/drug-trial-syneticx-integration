import nodemailer from 'nodemailer'
import logger from './logger.js'

// Email transporter configuration
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP service)
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }

  // For production, use environment variables
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Email templates
const emailTemplates = {
  welcome: {
    subject: '🔬 Welcome to MedResearch AI Updates!',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MedResearch AI</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #0ea5e9, #8b5cf6); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .areas { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
          .area-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
          .footer { background: #374151; color: #9ca3af; text-align: center; padding: 20px; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔬 Welcome to MedResearch AI</h1>
            <p>Your gateway to the latest medical research insights</p>
          </div>
          <div class="content">
            <div class="card">
              <h2>🎉 Welcome to the Future of Medical Research</h2>
              <p>Thank you for subscribing to MedResearch AI research updates! You'll receive curated, AI-powered insights about the latest developments in medical research.</p>
              
              <h3>📋 Your Subscription Details</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Update Frequency:</strong> ${data.frequency}</p>
              <p><strong>Research Areas:</strong></p>
              <div class="areas">
                ${data.researchAreas.map(area => `<span class="area-tag">${area}</span>`).join('')}
              </div>
            </div>

            <div class="card">
              <h3>🔬 What You'll Receive</h3>
              <ul>
                <li>📊 <strong>Research Insights:</strong> AI-curated summaries of breakthrough studies</li>
                <li>🧪 <strong>Clinical Trial Updates:</strong> Latest trial results and opportunities</li>
                <li>💡 <strong>Expert Analysis:</strong> Clear explanations of complex medical findings</li>
                <li>🔗 <strong>Direct Links:</strong> Easy access to full research papers and studies</li>
              </ul>
            </div>

            <div class="card">
              <h3>⚡ Get Started</h3>
              <p>Visit MedResearch AI to start exploring the latest medical research with AI-powered analysis.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                🚀 Explore MedResearch AI
              </a>
            </div>
          </div>
          <div class="footer">
            <p>You're receiving this email because you subscribed to MedResearch AI research updates.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscriptions/unsubscribe/${data.unsubscribeToken}" style="color: #60a5fa;">Unsubscribe</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #60a5fa;">Visit MedResearch AI</a></p>
            <p>© 2025 MedResearch AI. Advancing medical knowledge through AI.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  researchUpdate: {
    subject: (area) => `🔬 New Research Update${area ? ` - ${area}` : ''}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Research Update - MedResearch AI</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #10b981, #0ea5e9); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { background: #374151; color: #9ca3af; text-align: center; padding: 20px; border-radius: 0 0 8px 8px; font-size: 12px; }
          .research-area { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔬 ${data.subject}</h1>
            <p>Latest medical research insights powered by AI</p>
            ${data.researchArea ? `<div class="research-area">${data.researchArea}</div>` : ''}
          </div>
          <div class="content">
            <div class="card">
              ${data.body}
            </div>

            <div class="card">
              <h3>🔗 Continue Your Research</h3>
              <p>Discover more insights and explore the full research analysis on MedResearch AI.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                📊 Explore More Research
              </a>
            </div>
          </div>
          <div class="footer">
            <p>You received this research update from MedResearch AI.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscriptions/unsubscribe/${data.unsubscribeToken}" style="color: #60a5fa;">Unsubscribe</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #60a5fa;">Update Preferences</a></p>
            <p>© 2025 MedResearch AI. Advancing medical knowledge through AI.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Send welcome email
export const sendWelcomeEmail = async (email, data) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM_ADDRESS || '"MedResearch AI" <noreply@medresearch-ai.com>',
      to: email,
      subject: emailTemplates.welcome.subject,
      html: emailTemplates.welcome.html({ ...data, email })
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Welcome email sent to ${email}: ${info.messageId}`)
    
    // Log preview URL for development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }
    
    return info
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error)
    throw error
  }
}

// Send research update email
export const sendResearchUpdateEmail = async (email, data) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM_ADDRESS || '"MedResearch AI" <noreply@medresearch-ai.com>',
      to: email,
      subject: data.subject || emailTemplates.researchUpdate.subject(data.researchArea),
      html: emailTemplates.researchUpdate.html(data)
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Research update email sent to ${email}: ${info.messageId}`)
    
    // Log preview URL for development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }
    
    return info
  } catch (error) {
    logger.error(`Failed to send research update email to ${email}:`, error)
    throw error
  }
}

// Send bulk research updates
export const sendBulkResearchUpdates = async (subscribers, content) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  }

  for (const subscriber of subscribers) {
    try {
      await sendResearchUpdateEmail(subscriber.email, {
        ...content,
        unsubscribeToken: subscriber.unsubscribeToken
      })
      
      await subscriber.updateLastSent()
      results.sent++
    } catch (error) {
      results.failed++
      results.errors.push({
        email: subscriber.email,
        error: error.message
      })
    }
  }

  logger.info(`Bulk email results: ${results.sent} sent, ${results.failed} failed`)
  return results
}

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    logger.info('Email configuration is valid')
    return true
  } catch (error) {
    logger.error('Email configuration test failed:', error)
    return false
  }
}