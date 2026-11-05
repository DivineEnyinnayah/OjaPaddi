import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import { AlertDialog } from "./alert-dialog";

describe("AlertDialog", () => {
  const base = { visible: true, onConfirm: jest.fn(), onCancel: jest.fn() };

  it("renders title and message", () => {
    render(<AlertDialog {...base} title="Delete product?" message="This cannot be undone." />);
    expect(screen.getByText("Delete product?")).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
  });

  it("fires onConfirm", () => {
    const onConfirm = jest.fn();
    render(<AlertDialog {...base} onConfirm={onConfirm} title="Sure?" />);
    fireEvent.press(screen.getByLabelText("OK"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("fires onCancel", () => {
    const onCancel = jest.fn();
    render(<AlertDialog {...base} onCancel={onCancel} title="Sure?" />);
    fireEvent.press(screen.getByLabelText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
