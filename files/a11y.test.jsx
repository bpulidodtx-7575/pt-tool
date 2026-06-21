import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import App from "./PlagiocephalyTool";
import { LegalDisclaimer, NumberInput, AlertBox, ThemeToggle, ShortcutsHelp, ReloadPromptView } from "./components";
import { SeverityTable, AgeGuidelines } from "./panels";

// jsdom can't compute colour contrast, so disable that rule everywhere — the
// remaining checks (roles, names, labels, structure) are what we can assert here.
const axeOpts = { rules: { "color-contrast": { enabled: false } } };

beforeEach(() => {
  if (!navigator.clipboard) {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } });
  }
});

describe("accessibility (axe)", () => {
  it("the disclaimer modal has no violations", async () => {
    const { container } = render(<LegalDisclaimer onDismiss={() => {}} />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("a labelled number input has no violations", async () => {
    const { container } = render(
      <NumberInput id="cvai-a" label="Diagonal A" hint="longer" rangeLabel="80–200 mm" value="" onChange={() => {}} />,
    );
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the PWA update prompt has no violations", async () => {
    const { container } = render(
      <ReloadPromptView offlineReady={false} needRefresh={true} onReload={() => {}} onClose={() => {}} />,
    );
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("a filled, errored number input (clear button + aria-invalid) has no violations", async () => {
    const { container } = render(
      <NumberInput
        id="cvai-a"
        label="Diagonal A"
        hint="longer"
        rangeLabel="80–200 mm"
        value="0"
        onChange={() => {}}
        status="error"
      />,
    );
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("an alert message has no violations", async () => {
    const { container } = render(<AlertBox>Diagonal A should be greater than Diagonal B.</AlertBox>);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the theme toggle has no violations", async () => {
    const { container } = render(<ThemeToggle />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the shortcuts help dialog has no violations", async () => {
    const { container } = render(<ShortcutsHelp open={true} onClose={() => {}} />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the severity table has no violations", async () => {
    const { container } = render(<SeverityTable />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the age guidelines (expanded) have no violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<AgeGuidelines />);
    await user.click(screen.getByRole("button", { name: /Age-specific guidelines/i }));
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it("the full app (disclaimer dismissed, result shown) has no violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole("button", { name: /Acknowledge disclaimer/i }));
    await user.type(screen.getByLabelText(/Diagonal A in millimeters/i), "100");
    await user.type(screen.getByLabelText(/Diagonal B in millimeters/i), "90");
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });
});
