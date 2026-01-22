import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOrderConfirmationEmail(to: string, subject: string, html: string, pdfBuffer?: Uint8Array) {
  const mailOptions: any = {
    from: `"NEX Commerce" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      { filename: "factura.pdf", content: pdfBuffer }
    ];
  }

  await transporter.sendMail(mailOptions);
}