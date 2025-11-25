import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import Modal, {
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../../../src/components/ui/Modal";

describe("Modal", () => {
  it("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal content
      </Modal>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal content
      </Modal>
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <ModalHeader>Header</ModalHeader>
      </Modal>
    );
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies className", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        Content
      </Modal>
    );
    expect(document.querySelector(".custom-modal")).toBeInTheDocument();
  });
});

describe("ModalHeader", () => {
  it("renders title correctly", () => {
    render(<ModalHeader>Modal Title</ModalHeader>);
    expect(screen.getByText("Modal Title")).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(<ModalHeader icon={<span>Icon</span>}>Title</ModalHeader>);
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });
});

describe("ModalBody", () => {
  it("renders children correctly", () => {
    render(<ModalBody>Body content</ModalBody>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});

describe("ModalFooter", () => {
  it("renders children correctly", () => {
    render(<ModalFooter>Footer content</ModalFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });
});
