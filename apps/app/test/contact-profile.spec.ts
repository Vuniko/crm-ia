import { describe, expect, it } from "bun:test";
import {
	contactProfileInput,
	instagramContactUrl,
	whatsappContactUrl,
} from "@crm/validation/contact-profile";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactQuickActions } from "../components/crm/contact-quick-actions";

describe("customer contact links", () => {
	it.each([
		["+51 999 123 456", "https://wa.me/51999123456"],
		["0051 (999) 123-456", "https://wa.me/51999123456"],
		["+1 (415) 555-2671", "https://wa.me/14155552671"],
		["999123456", null],
		["+51abc999123456", null],
		["+51 999123456 ext 1", null],
		["+0123456789", null],
		["+1234567890123456", null],
		["javascript:alert(1)", null],
		[null, null],
	])("builds a safe WhatsApp link for %s", (phone, expected) => {
		expect(whatsappContactUrl(phone)).toBe(expected);
	});

	it.each([
		["@ana.demo", "https://www.instagram.com/ana.demo/"],
		[" ana_demo ", "https://www.instagram.com/ana_demo/"],
		["https://evil.test/", null],
		["ana?redirect=evil", null],
		["../bad/path", null],
		["..", null],
		[".ana", null],
		["ana.", null],
		["ana..demo", null],
		["javascript:alert(1)", null],
		["", null],
		[null, null],
	])("builds a safe Instagram link for %s", (handle, expected) => {
		expect(instagramContactUrl(handle)).toBe(expected);
	});

	it("normalizes handles and preserves omitted properties", () => {
		expect(
			contactProfileInput.parse({ instagramHandle: " @ana.demo " }),
		).toEqual({ instagramHandle: "ana.demo" });
		expect(contactProfileInput.parse({})).toEqual({});
	});

	it("accepts explicit clearing and rejects unsupported channels", () => {
		expect(
			contactProfileInput.parse({ instagramHandle: "", preferredChannel: "" }),
		).toEqual({ instagramHandle: "", preferredChannel: "" });
		expect(
			contactProfileInput.safeParse({ preferredChannel: "invented" }).success,
		).toBe(false);
		expect(
			contactProfileInput.safeParse({ instagramHandle: "a".repeat(31) })
				.success,
		).toBe(false);
	});
});

describe("profile action controls", () => {
	it("renders accessible external links with privacy protections", () => {
		const html = renderToStaticMarkup(
			createElement(ContactQuickActions, {
				phone: "+51 999 123 456",
				instagramHandle: "ana.demo",
			}),
		);
		expect(html).toContain('href="https://wa.me/51999123456"');
		expect(html).toContain('href="https://www.instagram.com/ana.demo/"');
		expect(html).toContain('aria-label="Abrir conversación en WhatsApp"');
		expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(2);
		expect(html.match(/referrerPolicy="no-referrer"/g)).toHaveLength(2);
	});

	it("omits links for missing or unsafe destinations", () => {
		const html = renderToStaticMarkup(
			createElement(ContactQuickActions, {
				phone: "999123456",
				instagramHandle: "https://evil.test",
			}),
		);
		expect(html).not.toContain("href=");
	});

	it("keeps Instagram available without a phone number", () => {
		const html = renderToStaticMarkup(
			createElement(ContactQuickActions, {
				phone: null,
				instagramHandle: "@ana.demo",
			}),
		);
		expect(html).toContain('href="https://www.instagram.com/ana.demo/"');
		expect(html).not.toContain("wa.me");
	});
});
