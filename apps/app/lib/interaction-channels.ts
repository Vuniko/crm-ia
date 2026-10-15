export const INTERACTION_CHANNELS = [
	{ value: "general", label: "General" },
	{ value: "whatsapp", label: "WhatsApp" },
	{ value: "instagram", label: "Instagram" },
	{ value: "facebook", label: "Facebook Messenger" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "store", label: "En tienda" },
	{ value: "other", label: "Otro canal" },
] as const;

export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number]["value"];

export function interactionContent(
	channel: InteractionChannel,
	text: string,
	isTask: boolean,
) {
	const label = INTERACTION_CHANNELS.find(
		(item) => item.value === channel,
	)?.label;
	const prefix = channel === "general" ? "" : `[${label}] `;
	return isTask
		? { subject: `${prefix}${text}`, body: undefined }
		: { subject: prefix ? `Interacción · ${label}` : undefined, body: text };
}
