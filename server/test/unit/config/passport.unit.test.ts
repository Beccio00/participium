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
});