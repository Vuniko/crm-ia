import { z } from "zod";

export const CONTACT_CHANNELS = [
	{ value: "whatsapp", label: "WhatsApp" },
	{ value: "instagram", label: "Instagram" },
	{ value: "phone", label: "Llamada" },
	{ value: "email", label: "Correo electrónico" },
	{ value: "store", label: "En tienda" },
	{ value: "other", label: "Otro" },
] as const;

export const contactChannel = z.enum([
	"whatsapp",
	"instagram",
	"phone",
	"email",
	"store",
	"other",
]);

export const instagramHandle = z
	.string()
	.trim()
	.transform((value) => value.replace(/^@/, ""))
	.refine(
		(value) =>
			value === "" ||
			/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/.test(value),
		"Usa el usuario de Instagram, sin enlace y con un máximo de 30 caracteres.",
	);

export const contactProfileInput = z.object({
	instagramHandle: instagramHandle.optional(),
	preferredChannel: contactChannel.or(z.literal("")).optional(),
});

export const CONTACT_PROFILE_FIELDS = {
	instagramHandle: {
		id: "crm-retail-instagram-v1",
		key: "retail_instagram",
		label: "Instagram",
	},
	preferredChannel: {
		id: "crm-retail-preferred-channel-v1",
		key: "retail_preferred_channel",
		label: "Canal preferido",
	},
} as const;

export const contactProfile = z.object({
	instagramHandle: instagramHandle.nullable(),
	preferredChannel: contactChannel.nullable(),
});

export type ContactProfileInput = z.infer<typeof contactProfileInput>;

export function isContactProfileField(
	entity: string,
	key: string,
	id: string,
): boolean {
	return (
		entity === "CONTACT" &&
		Object.values(CONTACT_PROFILE_FIELDS).some(
			(field) => field.key === key && field.id === id,
		)
	);
}

export function whatsappContactUrl(phone: string | null): string | null {
	if (!phone) return null;
	const compact = phone.trim().replace(/[\s().-]/g, "");
	if (!/^(?:\+|00)[1-9]\d{6,14}$/.test(compact)) return null;
	const digits = compact.replace(/^(?:\+|00)/, "");
	return `https://wa.me/${digits}`;
}

export function instagramContactUrl(handle: string | null): string | null {
	const parsed = instagramHandle.safeParse(handle);
	return parsed.success && parsed.data
		? `https://www.instagram.com/${parsed.data}/`
		: null;
}
