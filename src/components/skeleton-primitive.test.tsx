import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./ui/skeleton";

describe("Skeleton", () => {
  it("renders skeleton", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    expect(container.firstChild).toBeTruthy();
  });
});
