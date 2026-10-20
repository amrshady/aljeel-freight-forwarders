import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("@/app/actions", () => ({
  signOut: vi.fn(),
}));

const props = {
  name: "Test User",
  role: "PROCUREMENT",
  company: "Test Company",
};

describe("Header", () => {
  it("links to the same-origin Cloudflare Access logout path in access mode", () => {
    const markup = renderToStaticMarkup(
      createElement(Header, { ...props, accessMode: true }),
    );

    expect(markup).toContain('href="/cdn-cgi/access/logout"');
    expect(markup).not.toContain("cloudflareaccess.com");
  });

  it("does not render a Cloudflare Access logout link in password mode", () => {
    const markup = renderToStaticMarkup(
      createElement(Header, { ...props, accessMode: false }),
    );

    expect(markup).not.toContain("/cdn-cgi/access/logout");
  });
});
