import { createTransport } from "nodemailer";

const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.STMP_USER,
        pass: process.env.STMP_PASSWORD,
    },
});

export const sendMail = async (to: string, subject: string, html: string) => {
    const res = await transporter.sendMail({
        from: "[EMAIL_ADDRESS]",
        to,
        subject,
        html,
    });
    return res;
};