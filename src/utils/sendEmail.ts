import nodemailer from 'nodemailer';

interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    console.log('📧 Email Config Check:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET',
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Missing EMAIL_USER or EMAIL_PASS in environment variables');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('📤 Sending email to:', options.to);
    console.log('📝 Subject:', options.subject);
    console.log('👤 From:', process.env.EMAIL_USER);
    
    const result = await transporter.sendMail({
      from: `"Kids Toys Store" <${process.env.EMAIL_USER}>`,
      to:      options.to,
      subject: options.subject,
      html:    options.html,
    });
    
    console.log('✅ Email sent successfully! Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Email sending failed:', (error as Error).message);
    throw error;
  }
};

export default sendEmail;