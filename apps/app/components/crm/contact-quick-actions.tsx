import { Button } from "@crm/ui/components/button";
import {
	instagramContactUrl,
	whatsappContactUrl,
} from "@crm/validation/contact-profile";

export function ContactQuickActions({
	phone,
	instagramHandle,
}: {
	phone: string | null;
	instagramHandle: string | null;
}) {
	const whatsappUrl = whatsappContactUrl(phone);
	const instagramUrl = instagramContactUrl(instagramHandle);
	return (
		<div className="flex flex-wrap gap-2">
			{whatsappUrl ? (
				<Button asChild variant="outline" size="sm">
					<a
						href={whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
						referrerPolicy="no-referrer"
						aria-label="Abrir conversación en WhatsApp"
					>
						WhatsApp
					</a>
				</Button>
			) : null}
			{instagramUrl ? (
				<Button asChild variant="outline" size="sm">
					<a
						href={instagramUrl}
						target="_blank"
						rel="noopener noreferrer"
						referrerPolicy="no-referrer"
						aria-label="Abrir perfil en Instagram"
					>
						Instagram
					</a>
				</Button>
			) : null}
		</div>
	);
}
