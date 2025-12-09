import { VerificationEmailError } from "../interfaces/errors/VerificationEmailError";

let resendClient: any = { emails: { send: async () => {} } };

try {
    // Dynamically require to avoid TypeScript resolution errors when the package
    // is not installed in the test environment.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Resend = require("resend").Resend;
    resendClient = new Resend(process.env.RESEND_API_KEY!);
} catch (err) {
    // If `resend` is not available, keep a noop client so tests and CI don't crash.
}

export async function sendVerificationEmail(email: string, code: string) {
    try {
        await resendClient.emails.send({
            from: "no-reply@participium.com",
            to: email,
            subject: "Verify your email address",
            html: `<p>Your verification code is: <strong>${code}</strong></p>
                    <p>this code will expire in 30 minutes.</p>`,
        });
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new VerificationEmailError();
    }
}