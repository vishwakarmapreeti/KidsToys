import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// This creates a connection with Gmail so your app can send emails.

interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"Kids Toys Store" <${process.env.EMAIL_USER}>`,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
  });
};

export default sendEmail; 