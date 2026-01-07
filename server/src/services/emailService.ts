import nodemailer from "nodemailer";
import { VerificationEmailError } from "../interfaces/errors/VerificationEmailError";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFromEnv = process.env.SMTP_FROM;
const smtpFromName = process.env.SMTP_FROM_NAME;
const smtpFromAddress = process.env.SMTP_FROM_ADDRESS || smtpUser || "no-reply@participium.com";

function buildFrom() {
    if (smtpFromEnv) {
        const m = smtpFromEnv.match(/^([^<]*)<([^>]+)>\s*$/);
        if (m) {
            return { name: m[1].trim().replace(/^"|"$/g, ""), address: m[2].trim() };
        }
        if (smtpFromEnv.includes("@")) {
            return { name: smtpFromName || "Participium", address: smtpFromEnv };
        }
        return { name: smtpFromEnv, address: smtpFromAddress };
    }

    return { name: smtpFromName || "Participium", address: smtpFromAddress };
}

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
        const from = buildFrom();
        const fromString = `"${from.name}" <${from.address}>`;
        
        await transporter.sendMail({
            from: fromString,
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