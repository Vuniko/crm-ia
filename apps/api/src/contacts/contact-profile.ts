import type { Db, Prisma } from "@crm/db";
import {
	CONTACT_PROFILE_FIELDS,
	type ContactProfileInput,
	contactProfile,
	contactProfileInput,
} from "@crm/validation/contact-profile";
import { BadRequestException } from "@nestjs/common";

export async function readContactProfile(db: Db, contactId: string) {
	const rows = await db.fieldValue.findMany({
		where: {
			contactId,
			fieldId: {
				in: Object.values(CONTACT_PROFILE_FIELDS).map((field) => field.id),
			},
			field: {
				entity: "CONTACT",
				key: {
					in: Object.values(CONTACT_PROFILE_FIELDS).map((field) => field.key),
				},
			},
		},
		select: { text: true, field: { select: { key: true } } },
	});
	const value = (key: string) =>
		rows.find((row) => row.field.key === key)?.text || null;
	return contactProfile.parse({
		instagramHandle: value(CONTACT_PROFILE_FIELDS.instagramHandle.key),
		preferredChannel: value(CONTACT_PROFILE_FIELDS.preferredChannel.key),
	});
}

export async function writeContactProfile(
	tx: Prisma.TransactionClient,
	contactId: string,
	input: ContactProfileInput,
) {
	const profile = contactProfileInput.parse(input);
	for (const property of ["instagramHandle", "preferredChannel"] as const) {
		const value = profile[property];
		if (value === undefined) continue;
		const { id, key, label } = CONTACT_PROFILE_FIELDS[property];
		const field = await tx.fieldDefinition.upsert({
			where: { entity_key: { entity: "CONTACT", key } },
			create: {
				id,
				entity: "CONTACT",
				key,
				label,
				type: "TEXT",
				position: 0,
				agentFilled: false,
				showOnSheet: false,
				showOnTable: false,
				showOnFilter: false,
			},
			update: {},
			select: { id: true, type: true, agentFilled: true, archivedAt: true },
		});
		if (
			field.id !== id ||
			field.type !== "TEXT" ||
			field.agentFilled ||
			field.archivedAt
		) {
			throw new BadRequestException(
				`El campo ${label} tiene una configuración incompatible. Revisa los campos del contacto.`,
			);
		}
		if (value === "") {
			await tx.fieldValue.deleteMany({
				where: { fieldId: field.id, contactId },
			});
		} else {
			await tx.fieldValue.upsert({
				where: { fieldId_contactId: { fieldId: field.id, contactId } },
				create: { fieldId: field.id, contactId, text: value },
				update: { text: value },
			});
		}
	}
}

export async function assertNoProfileFieldWrites(
	tx: Pick<Prisma.TransactionClient, "fieldDefinition">,
	keys: readonly string[],
) {
	const reserved = Object.values(CONTACT_PROFILE_FIELDS).filter((field) =>
		keys.includes(field.key),
	);
	if (reserved.length === 0) return;
	const owned = await tx.fieldDefinition.findFirst({
		where: {
			entity: "CONTACT",
			id: { in: reserved.map((field) => field.id) },
			key: { in: reserved.map((field) => field.key) },
		},
		select: { id: true },
	});
	if (owned)
		throw new BadRequestException(
			"Edita Instagram y canal preferido desde la ficha del cliente.",
		);
}
