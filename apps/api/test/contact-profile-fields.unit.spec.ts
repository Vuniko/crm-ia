import { describe, expect, it, mock } from "bun:test";
import type { Db } from "@crm/db";
import type { AgentTriggerService } from "../src/agent/agent-trigger.service";
import { FieldsService } from "../src/fields/fields.service";

describe("profile storage protection", () => {
	it.each(["retail_instagram", "retail_preferred_channel"])(
		"prevents custom-field management from changing %s",
		async (key) => {
			const update = mock(async () => ({}));
			const remove = mock(async () => ({}));
			const db = {
				fieldDefinition: {
					findUnique: async () => ({
						id:
							key === "retail_instagram"
								? "crm-retail-instagram-v1"
								: "crm-retail-preferred-channel-v1",
						entity: "CONTACT",
						key,
					}),
					update,
					delete: remove,
				},
			} as unknown as Db;
			const fields = new FieldsService(db, {} as AgentTriggerService);
			await expect(
				fields.update("field", { agentFilled: true }),
			).rejects.toThrow("ficha del cliente");
			await expect(fields.archive("field")).rejects.toThrow(
				"ficha del cliente",
			);
			await expect(fields.restore("field")).rejects.toThrow(
				"ficha del cliente",
			);
			await expect(fields.delete("field")).rejects.toThrow("ficha del cliente");
			expect(update).not.toHaveBeenCalled();
			expect(remove).not.toHaveBeenCalled();
		},
	);

	it("keeps internal profile definitions out of custom-field settings", async () => {
		const findMany = mock(async () => []);
		const db = { fieldDefinition: { findMany } } as unknown as Db;
		const fields = new FieldsService(db, {} as AgentTriggerService);
		await fields.list("CONTACT", false);
		expect(findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					entity: "CONTACT",
					id: {
						notIn: [
							"crm-retail-instagram-v1",
							"crm-retail-preferred-channel-v1",
						],
					},
				}),
			}),
		);
	});
});
