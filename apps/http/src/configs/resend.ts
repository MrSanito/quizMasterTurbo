import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResendEmail = async ({ to,subject,html}: { to: string,subject: string,html: string }) => {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    });
    return response;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    throw error;
  }
};