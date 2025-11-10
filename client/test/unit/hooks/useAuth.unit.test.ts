import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../../../src/hooks/useAuth";

// Mock fetch
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("initial state", () => {
    it("should have initial loading state", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("checkAuth", () => {
    it("should set user when authenticated", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/session/current", {
        method: "GET",
        credentials: "include",
      });
    });

    it("should set user to null when not authenticated", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("signup", () => {
    it("should signup successfully", async () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      };
      const mockResponse = { user: { id: 1, email: "john@example.com" } };

      // Mock checkAuth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });
      // Mock signup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signupResult = await result.current.signup(formData);

      expect(signupResult).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith("/api/citizen/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
    });

    it("should throw error on signup failure", async () => {
      const formData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      };

      // Mock checkAuth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });
      // Mock signup
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email already exists" }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.signup(formData)).rejects.toThrow(
        "Email already exists"
      );
    });
  });

  describe("login", () => {
    it("should login successfully and set user", async () => {
      const mockUser = { id: 1, email: "test@example.com" };

      // Mock checkAuth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });
      // Mock login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
    });

    it("should throw error on login failure", async () => {
      // Mock checkAuth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });
      // Mock login
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid credentials" }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.login("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should logout successfully and clear user", async () => {
      // First set a user
      const mockUser = { id: 1, email: "test@example.com" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Now logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith("/api/session/current", {
        method: "DELETE",
        credentials: "include",
      });
    });

    it("should throw error on logout failure", async () => {
      // Mock checkAuth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });
      // Mock logout
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Logout failed" }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.logout()).rejects.toThrow("Logout failed");
    });
  });
});
