import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { vi, type MockedFunction } from "vitest";
import { MemoryRouter } from "react-router";

// Mock useAuth
vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/" }),
  };
});

import Header from "../../src/components/Header";
import { useAuth } from "../../src/hooks/useAuth";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo and navigation", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Participium")).toBeInTheDocument();
  });

  it("shows login button when not authenticated", () => {
    (useAuth as MockedFunction<typeof useAuth>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
      loading: false,
      signup: vi.fn(),
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows user info and logout when authenticated", () => {
    (useAuth as MockedFunction<typeof useAuth>).mockReturnValue({
      user: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "citizen",
        telegramUsername: null,
        emailNotificationsEnabled: true,
      },
      isAuthenticated: true,
      logout: vi.fn(),
      loading: false,
      signup: vi.fn(),
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls logout and navigates on logout", async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    (useAuth as MockedFunction<typeof useAuth>).mockReturnValue({
      user: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "citizen",
        telegramUsername: null,
        emailNotificationsEnabled: true,
      },
      isAuthenticated: true,
      logout: mockLogout,
      loading: false,
      signup: vi.fn(),
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("shows back to home button when showBackToHome is true", () => {
    (useAuth as MockedFunction<typeof useAuth>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
      loading: false,
      signup: vi.fn(),
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header showBackToHome={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
  });
});
