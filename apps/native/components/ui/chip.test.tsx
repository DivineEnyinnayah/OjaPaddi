import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip>All</Chip>);
    expect(screen.getByText("All")).toBeTruthy();
  });

  it("renders as a button when pressable", () => {
    const onPress = jest.fn();
    render(<Chip onPress={onPress}>Cash</Chip>);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reflects selected state to assistive tech", () => {
    render(
      <Chip isActive onPress={() => {}}>
        Cash
      </Chip>,
    );
    expect(screen.getByRole("button")).toBeSelected();
  });

  it("supports the FigCraft status variants", () => {
    render(
      <>
        <Chip variant="default">All</Chip>
        <Chip variant="success">In stock</Chip>
        <Chip variant="warning">Low</Chip>
        <Chip variant="error">Out</Chip>
      </>,
    );
    expect(screen.getByText("Low")).toBeTruthy();
  });
});
