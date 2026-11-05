import React from "react";
import { render } from "@/test-utils/render";
import { Surface } from "./surface";
import { Skeleton } from "./skeleton";

describe("Surface", () => {
  it("renders children", () => {
    const { toJSON } = render(<Surface>Stock</Surface>);
    expect(JSON.stringify(toJSON())).toContain("Stock");
  });

  it.each(["primary", "hero", "quiet", "warning", "danger"] as const)(
    "renders variant %s",
    (variant) => {
      const { toJSON } = render(<Surface variant={variant}>x</Surface>);
      expect(String(JSON.stringify(toJSON()))).toContain("rounded-card");
    },
  );
});

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
