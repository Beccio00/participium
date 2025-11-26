import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import Button from "../../../src/components/ui/Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button", { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies correct variant classes", () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-primary");

    rerender(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-secondary");

    rerender(<Button variant="danger">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-danger");

    rerender(<Button variant="ghost">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-outline-primary");
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-sm");

    rerender(<Button size="lg">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-lg");

    rerender(<Button size="md">Button</Button>);
    expect(screen.getByRole("button")).not.toHaveClass("btn-sm", "btn-lg");
  });

  it("shows loading state", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-100");
  });

  it("passes through other props", () => {
    render(
      <Button type="submit" disabled>
        Button
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
  });
});
