export class VerificationEmailError extends Error {
  constructor(message = "Error sending verification email") {
    super(message);
    this.name = "VerificationEmailError";
  }
}