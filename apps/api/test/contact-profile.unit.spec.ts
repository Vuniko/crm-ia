import { describe, expect, it, mock } from "bun:test";
import type { Db, Prisma } from "@crm/db";
import { CONTACT_PROFILE_FIELDS } from "@crm/validation/contact-profile";
import {
	assertNoProfileFieldWrites,
	readContactProfile,
	writeContactProfile,
} from "../src/contacts/contact-profile";

function storage(
	configuration = {
		type: "TEXT",
		agentFilled: false,
		archivedAt: null as Date | null,
	},
) {
	const definition = mock(async (args: { create: { id: string } }) => ({
		id: args.create.id,
		...configuration,
	}));
	const upsert = mock(async () => ({}));
	const deleteMany = mock(async () => ({ count: 1 }));
	const tx = {
		fieldDefinition: { upsert: definition },
		fieldValue: { upsert, deleteMany },
	} as unknown as Prisma.TransactionClient;
	return { tx, definition, upsert, deleteMany };
}

describe("customer profile persistence", () => {
	it("leaves existing profiles untouched when inputs are omitted", async () => {
		const store = storage();
		await writeContactProfile(store.tx, "contact-a", {});
		expect(store.definition).not.toHaveBeenCalled();
		expect(store.upsert).not.toHaveBeenCalled();
		expect(store.deleteMany).not.toHaveBeenCalled();
	});

	it("writes normalized values for the requested contact only", async () => {
		const store = storage();
		await writeContactProfile(store.tx, "contact-a", {
			instagramHandle: " @ana.demo ",
			preferredChannel: "whatsapp",
		});
		expect(store.upsert).toHaveBeenCalledTimes(2);
		expect(store.upsert).toHaveBeenCalledWith({
			where: {
				fieldId_contactId: {
					fieldId: "crm-retail-instagram-v1",
					contactId: "contact-a",
				},
			},
			create: {
				fieldId: "crm-retail-instagram-v1",
				contactId: "contact-a",
				text: "ana.demo",
			},
			update: { text: "ana.demo" },
		});
		expect(store.definition).toHaveBeenCalledWith(
			expect.objectContaining({
				update: {},
				create: expect.objectContaining({
					agentFilled: false,
					showOnSheet: false,
					type: "TEXT",
				}),
			}),
		);
	});

	it("clears only the requested field value", async () => {
		const store = storage();
		await writeContactProfile(store.tx, "contact-a", { instagramHandle: "" });
		expect(store.upsert).not.toHaveBeenCalled();
		expect(store.deleteMany).toHaveBeenCalledWith({
			where: { fieldId: "crm-retail-instagram-v1", contactId: "contact-a" },
		});
	});

	it.each([
		{ type: "NUMBER", agentFilled: false, archivedAt: null },
		{ type: "TEXT", agentFilled: true, archivedAt: null },
		{ type: "TEXT", agentFilled: false, archivedAt: new Date() },
	])(
		"rejects incompatible definitions without overwriting them",
		async (configuration) => {
			const store = storage(configuration);
			await expect(
				writeContactProfile(store.tx, "contact-a", {
					preferredChannel: "whatsapp",
				}),
			).rejects.toThrow("incompatible");
			expect(store.upsert).not.toHaveBeenCalled();
		},
	);

	it("rejects invalid values before any storage call", async () => {
		const store = storage();
		await expect(
			writeContactProfile(store.tx, "contact-a", {
				instagramHandle: "https://evil.test",
			}),
		).rejects.toThrow();
		expect(store.definition).not.toHaveBeenCalled();
	});

	it("reads an empty profile for existing contacts without profile fields", async () => {
		const findMany = mock(async () => []);
		const db = { fieldValue: { findMany } } as unknown as Db;
		expect(await readContactProfile(db, "contact-a")).toEqual({
			instagramHandle: null,
			preferredChannel: null,
		});
		expect(findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ contactId: "contact-a" }),
			}),
		);
	});

	it("reads stored channel and handle without inferring customer preferences", async () => {
		const db = {
			fieldValue: {
				findMany: async () => [
					{
						field: { key: CONTACT_PROFILE_FIELDS.instagramHandle.key },
						text: "ana.demo",
					},
					{
						field: { key: CONTACT_PROFILE_FIELDS.preferredChannel.key },
						text: "instagram",
					},
				],
			},
		} as unknown as Db;
		expect(await readContactProfile(db, "contact-a")).toEqual({
			instagramHandle: "ana.demo",
			preferredChannel: "instagram",
		});
	});

	it("prevents raw writes to owned profile fields but preserves unrelated fields", async () => {
		const findFirst = mock(async () => ({ id: "crm-retail-instagram-v1" }));
		const tx = {
			fieldDefinition: { findFirst },
		} as unknown as Prisma.TransactionClient;
		await expect(
			assertNoProfileFieldWrites(tx, ["retail_instagram"]),
		).rejects.toThrow();
		await expect(
			assertNoProfileFieldWrites(tx, ["favorite_color"]),
		).resolves.toBeUndefined();
		await expect(assertNoProfileFieldWrites(tx, [])).resolves.toBeUndefined();
		expect(findFirst).toHaveBeenCalledTimes(1);
	});
	it("preserves legacy custom fields which share a profile key", async () => {
		const tx = {
			fieldDefinition: { findFirst: async () => null },
		} as unknown as Prisma.TransactionClient;
		await expect(
			assertNoProfileFieldWrites(tx, ["retail_instagram"]),
		).resolves.toBeUndefined();
	});
});
