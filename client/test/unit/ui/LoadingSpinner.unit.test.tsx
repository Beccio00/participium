import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoadingSpinner from "../../../src/components/ui/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("spinner-border");
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole("status")).toHaveClass("spinner-border-sm");

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole("status")).not.toHaveClass("spinner-border-sm");

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole("status")).toHaveStyle({
      width: "3rem",
      height: "3rem",
    });
  });

  it("applies className", () => {
    render(<LoadingSpinner className="custom-spinner" />);
    expect(screen.getByRole("status")).toHaveClass("custom-spinner");
  });

  it("has accessible text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toHaveClass("visually-hidden");
  });
});
