import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import WelcomeScreen from "@/app/(auth)/welcome";

const mockPush = jest.fn();

// jest hoists jest.mock() above the imports, so this is safe to declare here.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

describe("Welcome screen (FigCraft 02.1 — frame 415)", () => {
  beforeEach(() => mockPush.mockClear());

  it("renders the FigCraft headline", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Know stock\./)).toBeTruthy();
    expect(screen.getByText(/No guesswork\./)).toBeTruthy();
  });

  it("renders the single FigCraft CTA and no carousel dots", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Start free — no card")).toBeTruthy();
    expect(screen.queryByText(/Slide 1 of 3/)).toBeNull();
  });

  it("navigates to register from the CTA", () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText("Start free — no card"));
    expect(mockPush).toHaveBeenCalledWith("/register");
  });
});
