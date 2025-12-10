import nodemailer from "nodemailer";
import { VerificationEmailError } from "../interfaces/errors/VerificationEmailError";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser || "no-reply@participium.com";

function getTransport() {
    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP_USER and SMTP_PASS must be set in environment");
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
    });
}

export async function sendVerificationEmail(email: string, code: string) {
    try {
        const transporter = getTransport();
        await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: "Verify your email address",
            html: `<p>Your verification code is: <strong>${code}</strong></p>
                   <p>This code will expire in 30 minutes.</p>`,
        });
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new VerificationEmailError();
    }
}