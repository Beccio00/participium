import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Input from "../../../src/components/ui/Input";

describe("Input", () => {
  it("renders label correctly", () => {
    render(<Input label="Username" />);
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("renders input with correct type", () => {
    render(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("handles text input", async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole("textbox");
    await user.type(input, "test input");
    expect(input).toHaveValue("test input");
  });

  it("shows error message", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("shows helper text", () => {
    render(<Input helperText="Enter your name" />);
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Input type="password" />);
    const input = screen.getByDisplayValue("");
    expect(input).toHaveAttribute("type", "password");

    const toggleButton = document.querySelector(
      ".input-group-text"
    ) as HTMLElement;
    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });

  it("generates id from label", () => {
    render(<Input label="Email Address" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "email-address");
  });

  it("uses provided id", () => {
    render(<Input id="custom-id" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "custom-id");
  });
});
