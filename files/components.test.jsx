import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Toast,
  LegalDisclaimer,
  NumberInput,
  AlertBox,
  ResultCard,
  StickyResult,
  ThemeToggle,
  ShortcutsHelp,
} from "./components";

afterEach(() => vi.restoreAllMocks());

// userEvent.setup() installs a read-only navigator.clipboard, so we spy on its
// writeText (rather than replacing the object) to assert what gets copied.
function spyClipboard() {
  return vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("starts in System mode with an accessible, descriptive label", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /Theme: System/i });
    expect(btn).toHaveAttribute("title", expect.stringMatching(/switch to light/i));
  });

  it("cycles System -> Light -> Dark on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: /Theme: System/i }));
    expect(screen.getByRole("button", { name: /Theme: Light/i })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: /Theme: Light/i }));
    expect(screen.getByRole("button", { name: /Theme: Dark/i })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("honors an existing saved preference", () => {
    sessionStorage.setItem("pt-theme", "dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /Theme: Dark/i })).toBeInTheDocument();
  });
});

describe("ShortcutsHelp", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<ShortcutsHelp open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the shortcut list and focuses Close when open", () => {
    render(<ShortcutsHelp open={true} onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: /Keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByText(/Switch calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy result note for EMR/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close keyboard shortcuts dialog/i })).toHaveFocus();
  });

  it("calls onClose from the Close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsHelp open={true} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Close keyboard shortcuts dialog/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsHelp open={true} onClose={onClose} />);
    await user.click(screen.getByRole("dialog", { name: /Keyboard shortcuts/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("Toast", () => {
  it("is a polite live region that hides until visible", () => {
    const { rerender } = render(<Toast visible={false} />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(toast).toHaveClass("hidden");
    rerender(<Toast visible={true} />);
    expect(screen.getByRole("status")).not.toHaveClass("hidden");
  });
});

describe("LegalDisclaimer", () => {
  it("renders a labelled modal dialog and focuses the acknowledge button", () => {
    render(<LegalDisclaimer onDismiss={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const cta = screen.getByRole("button", { name: /Acknowledge disclaimer/i });
    expect(cta).toHaveFocus();
  });

  it("calls onDismiss when acknowledged", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<LegalDisclaimer onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: /Acknowledge disclaimer/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe("NumberInput", () => {
  it("links label, range hint, and a mm aria-label to the input", () => {
    render(<NumberInput id="x" label="Diagonal A" hint="longer" rangeLabel="80–200 mm" value="" onChange={() => {}} />);
    const input = screen.getByLabelText(/Diagonal A in millimeters/i);
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("aria-describedby", "x-range");
    expect(screen.getByText("80–200 mm")).toHaveAttribute("id", "x-range");
  });

  it("reports typed values through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberInput id="x" label="Diagonal A" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText(/Diagonal A in millimeters/i), "9");
    expect(onChange).toHaveBeenLastCalledWith("9");
  });

  it("moves focus to nextId on Enter", async () => {
    const user = userEvent.setup();
    render(
      <>
        <NumberInput id="a" label="A" value="" onChange={() => {}} nextId="b" />
        <NumberInput id="b" label="B" value="" onChange={() => {}} />
      </>,
    );
    const a = screen.getByLabelText(/^A in millimeters/i);
    const b = screen.getByLabelText(/^B in millimeters/i);
    a.focus();
    await user.keyboard("{Enter}");
    expect(b).toHaveFocus();
  });

  it("shows a clear button only when a value is present", () => {
    const { rerender } = render(<NumberInput id="x" label="Diagonal A" value="" onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /Clear Diagonal A/i })).not.toBeInTheDocument();
    rerender(<NumberInput id="x" label="Diagonal A" value="100" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Clear Diagonal A/i })).toBeInTheDocument();
  });

  it("clears the field and refocuses the input when the clear button is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberInput id="x" label="Diagonal A" value="100" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Clear Diagonal A/i }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.getByLabelText(/Diagonal A in millimeters/i)).toHaveFocus();
  });

  it("reflects an error status with aria-invalid + is-error", () => {
    render(<NumberInput id="x" label="Diagonal A" value="0" onChange={() => {}} status="error" />);
    const input = screen.getByLabelText(/Diagonal A in millimeters/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("is-error");
  });

  it("reflects a warn status without marking the field invalid", () => {
    render(<NumberInput id="x" label="Diagonal A" value="300" onChange={() => {}} status="warn" />);
    const input = screen.getByLabelText(/Diagonal A in millimeters/i);
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveClass("is-warn");
  });
});

describe("AlertBox", () => {
  it("renders its message in an assertive alert role", () => {
    render(<AlertBox>Diagonal A should be greater than Diagonal B.</AlertBox>);
    expect(screen.getByRole("alert")).toHaveTextContent(/greater than Diagonal B/i);
  });
});

const resultProps = {
  eyebrow: "CVAI",
  value: "10.00",
  unit: "%",
  rangeMain: "Level 4",
  rangeSub: "8.75–11.0%",
  sevLabel: "Severe asymmetry",
  sevVar: "var(--sev-4)",
  recommendation: "Refer for orthotic evaluation.",
  presentation: ["Marked ear shift", "Frontal bossing"],
  copyText: "PLAGIOCEPHALY ASSESSMENT…",
  onCopy: () => {},
  onClear: () => {},
};

describe("ResultCard", () => {
  it("renders value, severity, recommendation, and presentation bullets", () => {
    render(<ResultCard {...resultProps} />);
    expect(screen.getByText("10.00")).toBeInTheDocument();
    expect(screen.getByText("Severe asymmetry")).toBeInTheDocument();
    expect(screen.getByText("Refer for orthotic evaluation.")).toBeInTheDocument();
    expect(screen.getByText("Marked ear shift")).toBeInTheDocument();
    expect(screen.getByText("Frontal bossing")).toBeInTheDocument();
  });

  it("omits the presentation section when there are no bullets", () => {
    render(<ResultCard {...resultProps} presentation={[]} />);
    expect(screen.queryByText(/Clinical presentation/i)).not.toBeInTheDocument();
  });

  it("copies the note and notifies onCopy when 'Copy for EMR' is clicked", async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    const writeText = spyClipboard();
    render(<ResultCard {...resultProps} onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: /Copy structured note for EMR/i }));
    expect(writeText).toHaveBeenCalledWith("PLAGIOCEPHALY ASSESSMENT…");
    expect(onCopy).toHaveBeenCalledOnce();
    // Button flips to the "Copied" confirmation state.
    expect(await screen.findByRole("button", { name: /Copied to clipboard/i })).toBeInTheDocument();
  });

  it("triggers onClear from 'New patient'", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<ResultCard {...resultProps} onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: /start a new patient/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("StickyResult", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <StickyResult
        visible={false}
        value="10.0"
        label="Level 4"
        sevVar="var(--sev-4)"
        copyText="x"
        onCopy={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes a reachable, labelled Copy button (not hidden from AT)", async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    const writeText = spyClipboard();
    render(
      <StickyResult
        visible={true}
        value="10.0"
        label="Level 4"
        sevVar="var(--sev-4)"
        copyText="note-body"
        onCopy={onCopy}
      />,
    );
    const btn = screen.getByRole("button", { name: /Copy note for 10.0 Level 4 to clipboard/i });
    await user.click(btn);
    expect(writeText).toHaveBeenCalledWith("note-body");
    expect(onCopy).toHaveBeenCalledOnce();
  });
});
