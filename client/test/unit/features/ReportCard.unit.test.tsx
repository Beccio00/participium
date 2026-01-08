import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import ReportCard from "../../../src/features/reports/ReportCard";
import type { ReportCategory } from "../../../src/types/report.types";

const mockReport = {
  id: 1,
  title: "Broken Street Light",
  description: "The street light on Main St is not working",
  category: "PUBLIC_LIGHTING" as ReportCategory,
  status: "PENDING_APPROVAL" as const,
  address: "Main St, 123",
  latitude: 45.0703,
  longitude: 7.6869,
  createdAt: "2023-10-01T10:00:00Z",
};

describe("ReportCard", () => {
  it("renders report information correctly", () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText("Broken Street Light")).toBeInTheDocument();
    expect(
      screen.getByText("The street light on Main St is not working")
    ).toBeInTheDocument();
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
    expect(screen.getByText("Main St, 123")).toBeInTheDocument();
    expect(screen.getByText("01/10/2023")).toBeInTheDocument();
  });

  it("applies selected styling", () => {
    render(<ReportCard report={mockReport} isSelected={true} />);
    const card = screen.getByText("Broken Street Light").parentElement
      ?.parentElement;
    expect(card).toHaveStyle({ background: "rgba(200, 110, 98, 0.05)" });
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ReportCard report={mockReport} onClick={onClick} />);
    await user.click(screen.getByText("Broken Street Light"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows correct status badge color", () => {
    const { rerender } = render(
      <ReportCard report={{ ...mockReport, status: "RESOLVED" }} />
    );
    expect(screen.getByText("Resolved")).toHaveStyle({
      backgroundColor: "#10b981",
    });

    rerender(<ReportCard report={{ ...mockReport, status: "IN_PROGRESS" }} />);
    expect(screen.getByText("In Progress")).toHaveStyle({
      backgroundColor: "#06b6d4",
    });

    rerender(<ReportCard report={{ ...mockReport, status: "PENDING_APPROVAL" }} />);
    expect(screen.getByText("Pending Approval")).toHaveStyle({
      backgroundColor: "#f59e0b",
    });
  });

  it("does not show created date if not provided", () => {
    render(<ReportCard report={{ ...mockReport, createdAt: undefined }} />);
    expect(screen.queryByText("10/1/2023")).not.toBeInTheDocument();
  });
});
