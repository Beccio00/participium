describe('emailService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  it('calls nodemailer sendMail when SMTP configured', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({});
    const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

    jest.doMock('nodemailer', () => ({ createTransport: createTransportMock }));

    process.env.SMTP_USER = 'participium.turin.municipality@gmail.com';
    process.env.SMTP_PASS = 'app-pass';

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    await sendVerificationEmail('u@example.com', '123456');

    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@example.com' }));
  });

  it('throws VerificationEmailError when sendMail fails', async () => {
    const sendMailMock = jest.fn().mockRejectedValue(new Error('boom'));
    const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

    jest.doMock('nodemailer', () => ({ createTransport: createTransportMock }));

    process.env.SMTP_USER = 'participium.turin.municipality@gmail.com';
    process.env.SMTP_PASS = 'app-pass';

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    await expect(sendVerificationEmail('u2@example.com', '000000')).rejects.toThrow();
  });

  it('throws VerificationEmailError when SMTP credentials are missing', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({});
    const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

    jest.doMock('nodemailer', () => ({ createTransport: createTransportMock }));

    // Ensure credentials are unset
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    await expect(sendVerificationEmail('u3@example.com', '111111')).rejects.toThrow();
  });
});
