import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./PlagiocephalyTool";

// Dismiss the legal disclaimer that blocks the UI on first render.
async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /Acknowledge disclaimer/i }));
  return user;
}

const aInput = () => screen.getByLabelText(/Diagonal A in millimeters/i);
const bInput = () => screen.getByLabelText(/Diagonal B in millimeters/i);

describe("<App /> — disclaimer gate", () => {
  it("shows the disclaimer dialog before the tool is usable", () => {
    render(<App />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Not a Diagnostic Device/i })).toBeInTheDocument();
  });

  it("dismisses the disclaimer on acknowledgement", async () => {
    await renderApp();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("<App /> — CVAI panel", () => {
  it("prompts for input before any measurement is entered", async () => {
    await renderApp();
    expect(screen.getByText(/Enter both diagonal measurements/i)).toBeInTheDocument();
  });

  it("renders the correct CVAI value and CHOA severity level", async () => {
    const user = await renderApp();
    // 100 vs 90 → CVAI 10.0% → Level 4 (severe)
    await user.type(aInput(), "100");
    await user.type(bInput(), "90");

    // "10.00" (two decimals) is unique to the result card; the sticky bar shows "10.0".
    expect(screen.getByText("10.00")).toBeInTheDocument();
    expect(screen.getByText(/Severe asymmetry/i)).toBeInTheDocument();
    // "Level 4" appears in both the result card and the sticky bar.
    expect(screen.getAllByText("Level 4").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Copy structured note for EMR/i })).toBeInTheDocument();
  });

  it("guards against Diagonal A not being the longer measurement", async () => {
    const user = await renderApp();
    await user.type(aInput(), "90");
    await user.type(bInput(), "100");
    expect(screen.getByRole("alert")).toHaveTextContent(/Diagonal A should be greater than Diagonal B/i);
    // No result card should be shown while the inputs are invalid — its
    // EMR copy button is a reliable, unique marker for the card.
    expect(screen.queryByRole("button", { name: /Copy structured note for EMR/i })).not.toBeInTheDocument();
  });

  it("rejects non-positive input", async () => {
    const user = await renderApp();
    await user.type(aInput(), "0");
    await user.type(bInput(), "90");
    expect(screen.getByRole("alert")).toHaveTextContent(/greater than zero/i);
  });

  it("warns when a measurement is outside the typical range", async () => {
    const user = await renderApp();
    await user.type(aInput(), "300");
    await user.type(bInput(), "90");
    expect(screen.getByText(/Outside typical range/i)).toBeInTheDocument();
  });
});

describe("<App /> — tab switching", () => {
  it("switches to the Brachycephaly (Cephalic Ratio) panel", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("tab", { name: /Brachycephaly/i }));
    expect(screen.getByRole("heading", { name: /Cephalic Ratio/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Width \(M\/L\) in millimeters/i)).toBeInTheDocument();
  });

  it("computes the Cephalic Ratio and flags orthotic evaluation when CR > 90", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("tab", { name: /Brachycephaly/i }));
    // 95 / 100 → CR 95.0 → ortho
    await user.type(screen.getByLabelText(/Width \(M\/L\) in millimeters/i), "95");
    await user.type(screen.getByLabelText(/Length \(A\/P\) in millimeters/i), "100");
    expect(screen.getByText("95.0")).toBeInTheDocument();
    expect(screen.getByText(/Orthotic evaluation recommended/i)).toBeInTheDocument();
  });
});

describe("<App /> — keyboard shortcuts", () => {
  it("opens the shortcuts help dialog with '?'", async () => {
    const user = await renderApp();
    await user.keyboard("?");
    expect(screen.getByRole("dialog", { name: /Keyboard shortcuts/i })).toBeInTheDocument();
  });

  it("switches calculator with 't'", async () => {
    const user = await renderApp();
    expect(screen.getByRole("heading", { level: 1, name: /Cranial Vault Asymmetry Index/i })).toBeInTheDocument();
    await user.keyboard("t");
    expect(screen.getByRole("heading", { level: 1, name: /Cephalic Ratio/i })).toBeInTheDocument();
  });

  it("clears measurements with 'n' (works while a number field is focused)", async () => {
    const user = await renderApp();
    await user.type(aInput(), "100");
    await user.type(bInput(), "90");
    expect(screen.getByText("10.00")).toBeInTheDocument();
    await user.keyboard("n");
    expect(aInput()).toHaveValue(null);
    expect(screen.getByText(/Enter both diagonal measurements/i)).toBeInTheDocument();
  });

  it("copies the current note with 'c'", async () => {
    const user = await renderApp();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    await user.type(aInput(), "100");
    await user.type(bInput(), "90");
    await user.keyboard("c");
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("PLAGIOCEPHALY ASSESSMENT"));
  });
});

describe("<App /> — clear", () => {
  beforeEach(() => {
    // userEvent reads clipboard; ensure a stub exists in jsdom.
    if (!navigator.clipboard) {
      Object.assign(navigator, { clipboard: { writeText: async () => {} } });
    }
  });

  it("clears all measurements on 'New patient'", async () => {
    const user = await renderApp();
    await user.type(aInput(), "100");
    await user.type(bInput(), "90");
    expect(screen.getByText("10.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start a new patient/i }));
    expect(aInput()).toHaveValue(null);
    expect(screen.getByText(/Enter both diagonal measurements/i)).toBeInTheDocument();
  });
});
