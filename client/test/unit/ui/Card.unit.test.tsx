import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Card, { CardHeader, CardBody } from "../../../src/components/ui/Card";

describe("Card", () => {
  it("renders children correctly", () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText("Content").closest(".card")).toHaveClass(
      "custom-class"
    );
  });
});

describe("CardHeader", () => {
  it("renders children correctly", () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<CardHeader className="header-class">Header</CardHeader>);
    expect(screen.getByText("Header").closest(".card-header")).toHaveClass(
      "header-class"
    );
  });
});

describe("CardBody", () => {
  it("renders children correctly", () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<CardBody className="body-class">Body</CardBody>);
    expect(screen.getByText("Body").closest(".card-body")).toHaveClass(
      "body-class"
    );
  });
});
