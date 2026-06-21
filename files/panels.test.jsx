import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeverityTable, AgeGuidelines } from "./panels";
import { SEVERITY } from "./calc";

describe("SeverityTable", () => {
  it("renders a captioned table with one row per CHOA severity level", () => {
    render(<SeverityTable />);
    const table = screen.getByRole("table");
    // One row per level plus the header row.
    expect(within(table).getAllByRole("row")).toHaveLength(SEVERITY.length + 1);
    for (const s of SEVERITY) {
      expect(within(table).getByText(`L${s.level}`)).toBeInTheDocument();
    }
  });

  it("has column headers and an external link to the official CHOA scale", () => {
    render(<SeverityTable />);
    for (const h of ["Level", "CVAI", "Presentation", "Recommendation"]) {
      expect(screen.getByRole("columnheader", { name: h })).toBeInTheDocument();
    }
    const link = screen.getByRole("link", { name: /official CHOA/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("AgeGuidelines", () => {
  it("is collapsed by default and exposes an expandable toggle", () => {
    render(<AgeGuidelines />);
    const toggle = screen.getByRole("button", { name: /Age-specific guidelines/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/two-month repositioning period/i)).not.toBeInTheDocument();
  });

  it("reveals the age-specific content when expanded", async () => {
    const user = userEvent.setup();
    render(<AgeGuidelines />);
    const toggle = screen.getByRole("button", { name: /Age-specific guidelines/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/two-month repositioning period/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plagiocephaly" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Brachycephaly" })).toBeInTheDocument();
  });
});
