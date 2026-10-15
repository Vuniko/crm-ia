import { describe, expect, it } from "bun:test";
import {
	INTERACTION_CHANNELS,
	interactionContent,
} from "./interaction-channels";

describe("manual interaction history", () => {
	it("keeps existing general notes unchanged", () => {
		expect(
			interactionContent("general", "Consulta por talla 39", false),
		).toEqual({
			subject: undefined,
			body: "Consulta por talla 39",
		});
	});

	it.each(INTERACTION_CHANNELS.filter((item) => item.value !== "general"))(
		"preserves channel $label and the original message",
		({ value, label }) => {
			expect(
				interactionContent(value, "Modelo <nuevo> & talla 39", false),
			).toEqual({
				subject: `Interacción · ${label}`,
				body: "Modelo <nuevo> & talla 39",
			});
		},
	);

	it("keeps the channel in follow-up tasks", () => {
		expect(interactionContent("whatsapp", "Confirmar stock", true)).toEqual({
			subject: "[WhatsApp] Confirmar stock",
			body: undefined,
		});
	});

	it("keeps existing general tasks unchanged", () => {
		expect(interactionContent("general", "Llamar al cliente", true)).toEqual({
			subject: "Llamar al cliente",
			body: undefined,
		});
	});
});
