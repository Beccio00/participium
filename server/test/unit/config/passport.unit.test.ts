import { Roles } from '../../../src/interfaces/UserDTO';
import { toUserDTO } from '../../../src/interfaces/UserDTO';
import * as userService from '../../../src/services/userService';
import * as passwordService from '../../../src/services/passwordService';

// Mock dependencies
jest.mock('../../../src/services/userService');
jest.mock('../../../src/services/passwordService');
jest.mock('../../../src/interfaces/UserDTO');

const mockFindByEmail = userService.findByEmail as jest.MockedFunction<typeof userService.findByEmail>;
const mockFindById = userService.findById as jest.MockedFunction<typeof userService.findById>;
const mockVerifyPassword = passwordService.verifyPassword as jest.MockedFunction<typeof passwordService.verifyPassword>;
const mockToUserDTO = toUserDTO as jest.MockedFunction<typeof toUserDTO>;

// Mock passport 
const mockUse = jest.fn();
const mockSerializeUser = jest.fn();
const mockDeserializeUser = jest.fn();

jest.mock('passport', () => ({
  use: mockUse,
  serializeUser: mockSerializeUser,
  deserializeUser: mockDeserializeUser,
}));

// Import configurePassport after mocking
import { configurePassport } from '../../../src/config/passport';

describe('passport configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('configurePassport', () => {
    it('should configure passport with local strategy', () => {
      configurePassport();
      
      // Verify that passport.use was called (strategy was registered)
      expect(mockUse).toHaveBeenCalledTimes(1);
      
      // Verify that serialization functions were set up
      expect(mockSerializeUser).toHaveBeenCalledTimes(1);
      expect(mockDeserializeUser).toHaveBeenCalledTimes(1);
    });

    describe('LocalStrategy authentication', () => {
      let strategyCallback: any;

      beforeEach(() => {
        configurePassport();
        // Extract the strategy callback from the LocalStrategy constructor call
        const strategyInstance = mockUse.mock.calls[0][0];
        strategyCallback = strategyInstance._verify;
      });

      it('should authenticate user with valid credentials', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'CITIZEN'
        };
        const mockUserDTO = {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: Roles.CITIZEN,
          telegramUsername: null,
          emailNotificationsEnabled: true
        };

        mockFindByEmail.mockResolvedValue(mockUser as any);
        mockVerifyPassword.mockResolvedValue(true);
        mockToUserDTO.mockReturnValue(mockUserDTO);

        const doneSpy = jest.fn();
        await strategyCallback('test@example.com', 'password123', doneSpy);

        expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockVerifyPassword).toHaveBeenCalledWith(mockUser, 'password123');
        expect(mockToUserDTO).toHaveBeenCalledWith(mockUser);
        expect(doneSpy).toHaveBeenCalledWith(null, mockUserDTO);
      });

      it('should reject user with non-existent email', async () => {
        mockFindByEmail.mockResolvedValue(null);

        const doneSpy = jest.fn();
        await strategyCallback('nonexistent@example.com', 'password123', doneSpy);

        expect(mockFindByEmail).toHaveBeenCalledWith('nonexistent@example.com');
        expect(mockVerifyPassword).not.toHaveBeenCalled();
        expect(mockToUserDTO).not.toHaveBeenCalled();
        expect(doneSpy).toHaveBeenCalledWith(null, false);
      });

      it('should reject user with invalid password', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'CITIZEN'
        };

        mockFindByEmail.mockResolvedValue(mockUser as any);
        mockVerifyPassword.mockResolvedValue(false);

        const doneSpy = jest.fn();
        await strategyCallback('test@example.com', 'wrongpassword', doneSpy);

        expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockVerifyPassword).toHaveBeenCalledWith(mockUser, 'wrongpassword');
        expect(mockToUserDTO).not.toHaveBeenCalled();
        expect(doneSpy).toHaveBeenCalledWith(null, false);
      });

      it('should handle database errors during authentication', async () => {
        const dbError = new Error('Database connection failed');
        mockFindByEmail.mockRejectedValue(dbError);

        const doneSpy = jest.fn();
        await strategyCallback('test@example.com', 'password123', doneSpy);

        expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
        expect(doneSpy).toHaveBeenCalledWith(dbError);
      });
    });

    it('should set up user serialization', () => {
      configurePassport();
      
      const serializeCall = mockSerializeUser.mock.calls[0][0];
      expect(typeof serializeCall).toBe('function');
      
      // Test serialization function
      const mockUser = { id: 123 };
      const doneSpy = jest.fn();
      serializeCall(mockUser, doneSpy);
      
      expect(doneSpy).toHaveBeenCalledWith(null, 123);
    });

    it('should set up user deserialization for valid user', async () => {
      const mockUser = {
        id: 123,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'CITIZEN'
      };
      const mockUserDTO = {
        id: 123,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindById.mockResolvedValue(mockUser as any);
      mockToUserDTO.mockReturnValue(mockUserDTO);

      configurePassport();
      
      const deserializeCall = mockDeserializeUser.mock.calls[0][0];
      expect(typeof deserializeCall).toBe('function');
      
      const doneSpy = jest.fn();
      await deserializeCall(123, doneSpy);
      
      expect(mockFindById).toHaveBeenCalledWith(123);
      expect(mockToUserDTO).toHaveBeenCalledWith(mockUser);
      expect(doneSpy).toHaveBeenCalledWith(null, mockUserDTO);
    });

    it('should handle non-existent user during deserialization', async () => {
      mockFindById.mockResolvedValue(null);

      configurePassport();
      
      const deserializeCall = mockDeserializeUser.mock.calls[0][0];
      const doneSpy = jest.fn();
      
      await deserializeCall(456, doneSpy);
      
      expect(mockFindById).toHaveBeenCalledWith(456);
      expect(doneSpy).toHaveBeenCalledWith(null, false);
    });

    it('should handle database errors during deserialization', async () => {
      const dbError = new Error('Database error');
      mockFindById.mockRejectedValue(dbError);

      configurePassport();
      
      const deserializeCall = mockDeserializeUser.mock.calls[0][0];
      const doneSpy = jest.fn();
      
      await deserializeCall(789, doneSpy);
      
      expect(mockFindById).toHaveBeenCalledWith(789);
      expect(doneSpy).toHaveBeenCalledWith(dbError);
    });
  });

  describe("Story 5 (PT05) - Authentication for report creation", () => {
    let strategyCallback: any;

    beforeEach(() => {
      configurePassport();
      const strategyInstance = mockUse.mock.calls[0][0];
      strategyCallback = strategyInstance._verify;
    });

    it("should authenticate citizen user for report creation", async () => {
      const mockCitizenUser = {
        id: 1,
        email: 'citizen@example.com',
        first_name: 'Mario',
        last_name: 'Rossi',
        role: 'CITIZEN'
      };
      const mockCitizenDTO = {
        id: 1,
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'citizen@example.com',
        role: Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindByEmail.mockResolvedValue(mockCitizenUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue(mockCitizenDTO);

      const doneSpy = jest.fn();
      await strategyCallback('citizen@example.com', 'password123', doneSpy);

      expect(mockFindByEmail).toHaveBeenCalledWith('citizen@example.com');
      expect(mockVerifyPassword).toHaveBeenCalledWith(mockCitizenUser, 'password123');
      expect(mockToUserDTO).toHaveBeenCalledWith(mockCitizenUser);
      expect(doneSpy).toHaveBeenCalledWith(null, mockCitizenDTO);
    });

    it("should authenticate municipality user (PUBLIC_RELATIONS)", async () => {
      const mockMunicipalityUser = {
        id: 2,
        email: 'pr@comune.torino.it',
        first_name: 'Giulia',
        last_name: 'Bianchi',
        role: 'PUBLIC_RELATIONS'
      };
      const mockMunicipalityDTO = {
        id: 2,
        firstName: 'Giulia',
        lastName: 'Bianchi',
        email: 'pr@comune.torino.it',
        role: Roles.PUBLIC_RELATIONS,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindByEmail.mockResolvedValue(mockMunicipalityUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue(mockMunicipalityDTO);

      const doneSpy = jest.fn();
      await strategyCallback('pr@comune.torino.it', 'password123', doneSpy);

      expect(doneSpy).toHaveBeenCalledWith(null, mockMunicipalityDTO);
    });

    it("should authenticate municipality user (TECHNICAL_OFFICE)", async () => {
      const mockTechnicalUser = {
        id: 3,
        email: 'tech@comune.torino.it',
        first_name: 'Luca',
        last_name: 'Verdi',
        role: 'TECHNICAL_OFFICE'
      };
      const mockTechnicalDTO = {
        id: 3,
        firstName: 'Luca',
        lastName: 'Verdi',
        email: 'tech@comune.torino.it',
        role: mockTechnicalUser.role as any,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindByEmail.mockResolvedValue(mockTechnicalUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue(mockTechnicalDTO);

      const doneSpy = jest.fn();
      await strategyCallback('tech@comune.torino.it', 'password123', doneSpy);

      expect(doneSpy).toHaveBeenCalledWith(null, mockTechnicalDTO);
    });

    it("should authenticate administrator user", async () => {
      const mockAdminUser = {
        id: 4,
        email: 'admin@comune.torino.it',
        first_name: 'Anna',
        last_name: 'Neri',
        role: 'ADMINISTRATOR'
      };
      const mockAdminDTO = {
        id: 4,
        firstName: 'Anna',
        lastName: 'Neri',
        email: 'admin@comune.torino.it',
        role: Roles.ADMINISTRATOR,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindByEmail.mockResolvedValue(mockAdminUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue(mockAdminDTO);

      const doneSpy = jest.fn();
      await strategyCallback('admin@comune.torino.it', 'password123', doneSpy);

      expect(doneSpy).toHaveBeenCalledWith(null, mockAdminDTO);
    });

    it("should handle email field validation correctly", async () => {
      const mockUser = {
        id: 5,
        email: 'valid.email+test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'CITIZEN'
      };
      const mockUserDTO = {
        id: 5,
        firstName: 'Test',
        lastName: 'User',
        email: 'valid.email+test@example.com',
        role: Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true
      };

      mockFindByEmail.mockResolvedValue(mockUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue(mockUserDTO);

      const doneSpy = jest.fn();
      await strategyCallback('valid.email+test@example.com', 'password123', doneSpy);

      expect(mockFindByEmail).toHaveBeenCalledWith('valid.email+test@example.com');
      expect(doneSpy).toHaveBeenCalledWith(null, mockUserDTO);
    });
  });

  describe("Edge cases and error handling", () => {
    let strategyCallback: any;
    let serializeCallback: any;
    let deserializeCallback: any;

    beforeEach(() => {
      configurePassport();
      const strategyInstance = mockUse.mock.calls[0][0];
      strategyCallback = strategyInstance._verify;
      serializeCallback = mockSerializeUser.mock.calls[0][0];
      deserializeCallback = mockDeserializeUser.mock.calls[0][0];
    });

    it("should handle password verification errors", async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'CITIZEN'
      };
      
      mockFindByEmail.mockResolvedValue(mockUser as any);
      mockVerifyPassword.mockRejectedValue(new Error('Password verification failed'));

      const doneSpy = jest.fn();
      await strategyCallback('test@example.com', 'password123', doneSpy);

      expect(doneSpy).toHaveBeenCalledWith(new Error('Password verification failed'));
    });

    it("should handle user serialization with different user structures", () => {
      const userWithExtraFields = { 
        id: 123, 
        firstName: 'Test', 
        lastName: 'User',
        email: 'test@example.com',
        extraField: 'should be ignored'
      };
      const doneSpy = jest.fn();
      
      serializeCallback(userWithExtraFields, doneSpy);
      
      expect(doneSpy).toHaveBeenCalledWith(null, 123);
    });

    it("should handle user deserialization with network timeouts", async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      mockFindById.mockRejectedValue(timeoutError);

      const doneSpy = jest.fn();
      await deserializeCallback(999, doneSpy);

      expect(mockFindById).toHaveBeenCalledWith(999);
      expect(doneSpy).toHaveBeenCalledWith(timeoutError);
    });

    it("should handle malformed user data during authentication", async () => {
      const malformedUser = {
        id: null,
        email: 'test@example.com',
        first_name: undefined,
        last_name: '',
        role: 'CITIZEN'
      };

      mockFindByEmail.mockResolvedValue(malformedUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue({
        id: 0,
        firstName: '',
        lastName: '',
        email: 'test@example.com',
        role: Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true
      });

      const doneSpy = jest.fn();
      await strategyCallback('test@example.com', 'password123', doneSpy);

      expect(mockToUserDTO).toHaveBeenCalledWith(malformedUser);
      expect(doneSpy).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'test@example.com'
      }));
    });

    it("should handle concurrent authentication attempts", async () => {
      const mockUser = {
        id: 1,
        email: 'concurrent@example.com',
        role: 'CITIZEN'
      };
      
      mockFindByEmail.mockResolvedValue(mockUser as any);
      mockVerifyPassword.mockResolvedValue(true);
      mockToUserDTO.mockReturnValue({
        id: 1,
        firstName: 'Concurrent',
        lastName: 'User',
        email: 'concurrent@example.com',
        role: Roles.CITIZEN,
        telegramUsername: null,
        emailNotificationsEnabled: true
      });

      const doneSpy1 = jest.fn();
      const doneSpy2 = jest.fn();

      // Simulate concurrent authentication
      await Promise.all([
        strategyCallback('concurrent@example.com', 'password123', doneSpy1),
        strategyCallback('concurrent@example.com', 'password123', doneSpy2)
      ]);

      expect(doneSpy1).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'concurrent@example.com'
      }));
      expect(doneSpy2).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'concurrent@example.com'
      }));
    });

    it("should maintain session consistency during user updates", async () => {
      // Test that passport deserialization gets fresh user data
      const originalUser = {
        id: 100,
        email: 'update@example.com',
        first_name: 'Original',
        last_name: 'User',
        role: 'CITIZEN'
      };
      
      const updatedUser = {
        id: 100,
        email: 'update@example.com',
        first_name: 'Updated',
        last_name: 'User',
        role: 'CITIZEN'
      };

      // First call returns original, second call returns updated
      mockFindById
        .mockResolvedValueOnce(originalUser as any)
        .mockResolvedValueOnce(updatedUser as any);
      
      mockToUserDTO
        .mockReturnValueOnce({
          id: 100,
          firstName: 'Original',
          lastName: 'User',
          email: 'update@example.com',
          role: Roles.CITIZEN,
          telegramUsername: null,
          emailNotificationsEnabled: true
        })
        .mockReturnValueOnce({
          id: 100,
          firstName: 'Updated',
          lastName: 'User',
          email: 'update@example.com',
          role: Roles.CITIZEN,
          telegramUsername: null,
          emailNotificationsEnabled: true
        });

      const doneSpy1 = jest.fn();
      const doneSpy2 = jest.fn();

      await deserializeCallback(100, doneSpy1);
      await deserializeCallback(100, doneSpy2);

      expect(doneSpy1).toHaveBeenCalledWith(null, expect.objectContaining({
        firstName: 'Original'
      }));
      expect(doneSpy2).toHaveBeenCalledWith(null, expect.objectContaining({
        firstName: 'Updated'
      }));
    });
  });
});