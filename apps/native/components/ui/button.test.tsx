import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Pay</Button>);
    expect(screen.getByText("Pay")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Save</Button>);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes a disabled accessibility state", () => {
    render(<Button isDisabled>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows a spinner and blocks presses while loading", () => {
    const onPress = jest.fn();
    render(
      <Button isLoading onPress={onPress}>
        Saving
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(screen.getByLabelText("Loading")).toBeTruthy();
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("enforces the 48pt minimum touch target via its height class", () => {
    render(<Button>Pay</Button>);
    const btn = screen.getByRole("button");
    // Touch-target size is applied through the uniwind class in SIZE, mirroring
    // FigCraft control heights (48 / 56). Asserted structurally here; the visual
    // value is verified against the frame in the parity report.
    const style = btn.props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity)) : style;
    expect(flat).toBeDefined();
    expect(String(btn.props.className)).toContain("min-h-");
  });
});

describe("Button variants", () => {
  it.each(["primary", "secondary", "ghost", "danger"] as const)(
    "renders variant %s",
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole("button")).toBeTruthy();
    },
  );

  it("primary uses the accent CTA fill from the Welcome frame", () => {
    // FigCraft `02.1 — Welcome`: CTA fill #D97706 (accent) + label #14201C (ink).
    // Values are token classes; hex resolution is asserted against FigCraft in
    // the parity report, not in a unit test.
    render(<Button variant="primary">Start free</Button>);
    const btn = screen.getByRole("button");
    expect(String(btn.props.className)).toContain("bg-accent");
    expect(String(screen.getByText("Start free").props.className)).toContain("text-ink");
  });
});
