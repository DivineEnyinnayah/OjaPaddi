import React from "react";
import { render, screen } from "@/test-utils/render";
import { Input } from "./input";

describe("Input", () => {
  it("renders its label", () => {
    render(<Input label="Email" />);
    // The visible label is presentational (hidden from the a11y tree); screen
    // readers get the name via the field's accessibilityLabel.
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("associates the label with the field for screen readers", () => {
    render(<Input label="Email" testID="email" />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("renders an error message with an alert role", () => {
    render(<Input label="Email" error="Wrong email or password." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong email or password.");
  });

  it("marks the field invalid when an error is present", () => {
    render(<Input label="Email" error="Required" testID="email" />);
    const field = screen.getByTestId("email");
    expect(field.props.accessibilityState?.invalid ?? field.props["aria-invalid"]).toBe(true);
  });

  it("does not render an error when none is provided", () => {
    render(<Input label="Email" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
