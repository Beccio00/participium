describe('emailService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('calls resend client when available', async () => {
    const mockSend = jest.fn().mockResolvedValue({});
    // Provide a fake 'resend' package before importing the service
    jest.doMock('resend', () => ({ Resend: function () { return { emails: { send: mockSend } }; } }));
    process.env.RESEND_API_KEY = 'test-key';

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    await sendVerificationEmail('u@example.com', '123456');

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@example.com' }));
  });

  it('throws VerificationEmailError when resend client send fails', async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error('boom'));
    jest.doMock('resend', () => ({ Resend: function () { return { emails: { send: mockSend } }; } }));
    process.env.RESEND_API_KEY = 'test-key';

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    await expect(sendVerificationEmail('u2@example.com', '000000')).rejects.toThrow();
  });

  it('uses noop client when resend package is not available', async () => {
    // Simulate require('resend') throwing at import time
    jest.doMock('resend', () => { throw new Error('not found'); });
    jest.resetModules();

    const { sendVerificationEmail } = require('../../../src/services/emailService');

    // Should not throw because emailService falls back to a noop client
    await expect(sendVerificationEmail('u3@example.com', '111111')).resolves.toBeUndefined();
  });
});
