import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Layout from "./layout";

describe("Layout", () => {
  it("renders children", () => {
    const { container } = render(
      // @ts-expect-error - testing layout as component
      <Layout>
        <div>child content</div>
      </Layout>
    );
    expect(container.textContent).toContain("child content");
  });
});
