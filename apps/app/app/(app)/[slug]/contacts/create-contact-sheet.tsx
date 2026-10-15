"use client";

import Add from "@carbon/icons-react/es/Add";
import { Button } from "@crm/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@crm/ui/components/field";
import { Icon } from "@crm/ui/components/icon";
import { Input } from "@crm/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@crm/ui/components/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@crm/ui/components/sheet";
import { Spinner } from "@crm/ui/components/spinner";
import {
	CONTACT_CHANNELS,
	contactProfileInput,
	instagramHandle as instagramHandleSchema,
} from "@crm/validation/contact-profile";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";
import { type ComponentProps, Suspense, useId, useState } from "react";
import { toast } from "sonner";
import { CompanyPicker } from "@/components/crm/company-picker";
import { useOpenRecord } from "@/components/crm/record-sheet/record-stack";
import { SEARCH_PARAM } from "@/lib/search-param-keys";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

const NONE = "none";

function AddButton(props: ComponentProps<typeof Button>) {
	return (
		<Button {...props}>
			<Icon icon={Add} data-icon="inline-start" />
			Nuevo contacto
		</Button>
	);
}

export function CreateContactSheet({ companyId }: { companyId?: string }) {
	return (
		<Suspense fallback={<AddButton disabled />}>
			<CreateContactForm companyId={companyId} />
		</Suspense>
	);
}

function CreateContactForm({ companyId }: { companyId?: string }) {
	const openRecord = useOpenRecord();
	const trpc = useTRPC();
	const cache = useCrmCache();

	const [open, setOpen] = useQueryState(
		SEARCH_PARAM.dialog.create,
		parseAsBoolean.withDefault(false),
	);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [title, setTitle] = useState("");
	const [phone, setPhone] = useState("");
	const [instagramHandle, setInstagramHandle] = useState("");
	const [preferredChannel, setPreferredChannel] = useState(NONE);
	const instagramCheck = instagramHandleSchema.safeParse(instagramHandle);
	const [company, setCompany] = useState(companyId ?? NONE);
	const [ownerId, setOwnerId] = useState(NONE);

	const firstNameId = useId();
	const lastNameId = useId();
	const emailId = useId();
	const titleId = useId();
	const phoneId = useId();
	const instagramId = useId();
	const instagramHelpId = useId();
	const channelId = useId();

	const users = useQuery(trpc.users.list.queryOptions());

	const create = useMutation(
		trpc.contacts.create.mutationOptions({
			onSuccess: async (contact) => {
				await cache.contact(contact.id);
				toast.success(
					`${[contact.firstName, contact.lastName].filter(Boolean).join(" ")} creado.`,
				);
				await setOpen(null);
				setFirstName("");
				setLastName("");
				setEmail("");
				setTitle("");
				setPhone("");
				setInstagramHandle("");
				setPreferredChannel(NONE);
				setCompany(companyId ?? NONE);
				setOwnerId(NONE);
				openRecord({ kind: "contact", id: contact.id });
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Sheet open={open} onOpenChange={(next) => setOpen(next || null)}>
			<SheetTrigger asChild>
				<AddButton />
			</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Nuevo contacto</SheetTitle>
					<SheetDescription>
						Registra a tu cliente. La empresa y el correo son opcionales. Un
						correo existente genera un aviso; no reemplaza al contacto.
					</SheetDescription>
				</SheetHeader>

				<form
					id="create-contact"
					className="flex-1 overflow-y-auto px-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (create.isPending || !firstName.trim()) return;
						const profile = contactProfileInput.safeParse({
							instagramHandle,
							preferredChannel:
								preferredChannel === NONE ? "" : preferredChannel,
						});
						if (!profile.success) return;
						create.mutate({
							...profile.data,
							phone: phone.trim() || undefined,
							firstName: firstName.trim(),
							lastName: lastName.trim() || undefined,
							email: email.trim() || undefined,
							title: title.trim() || undefined,
							companyId: company === NONE ? null : company,
							ownerId: ownerId === NONE ? null : ownerId,
						});
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={firstNameId}>Nombre</FieldLabel>
							<Input
								id={firstNameId}
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								autoComplete="off"
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor={lastNameId}>Apellidos</FieldLabel>
							<Input
								id={lastNameId}
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								autoComplete="off"
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor={emailId}>Correo electrónico</FieldLabel>
							<Input
								id={emailId}
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="off"
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor={phoneId}>Teléfono / WhatsApp</FieldLabel>
							<Input
								id={phoneId}
								type="tel"
								autoComplete="tel"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								placeholder="+51 999 123 456"
							/>
							<FieldDescription>
								Incluye + y código de país para abrir WhatsApp. No se comprueba
								si el número tiene WhatsApp.
							</FieldDescription>
						</Field>
						<Field data-invalid={!instagramCheck.success || undefined}>
							<FieldLabel htmlFor={instagramId}>Instagram</FieldLabel>
							<Input
								id={instagramId}
								value={instagramHandle}
								onChange={(event) => setInstagramHandle(event.target.value)}
								placeholder="@ana.demo"
								autoComplete="off"
								aria-invalid={!instagramCheck.success || undefined}
								aria-describedby={instagramHelpId}
							/>
							<FieldDescription id={instagramHelpId}>
								{instagramCheck.success
									? "Usuario opcional, sin enlace."
									: instagramCheck.error.issues[0]?.message}
							</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor={channelId}>Canal preferido</FieldLabel>
							<Select
								value={preferredChannel}
								onValueChange={setPreferredChannel}
							>
								<SelectTrigger id={channelId}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value={NONE}>Sin preferencia</SelectItem>
										{CONTACT_CHANNELS.map((channel) => (
											<SelectItem key={channel.value} value={channel.value}>
												{channel.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<FieldDescription>
								Indica cómo prefiere recibir seguimiento. No implica
								consentimiento para campañas.
							</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor={titleId}>Cargo (opcional)</FieldLabel>
							<Input
								id={titleId}
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="Cliente o encargado de compras"
								autoComplete="off"
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="create-contact-company">Empresa</FieldLabel>
							<CompanyPicker
								id="create-contact-company"
								value={company}
								onValueChange={setCompany}
								none={{ value: NONE, label: "Sin empresa" }}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="create-contact-owner">
								Responsable
							</FieldLabel>
							<Select value={ownerId} onValueChange={setOwnerId}>
								<SelectTrigger id="create-contact-owner">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NONE}>Sin asignar</SelectItem>
									{(users.data ?? []).map((user) => (
										<SelectItem key={user.id} value={user.id}>
											{user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					</FieldGroup>
				</form>

				<SheetFooter>
					<Button
						type="submit"
						form="create-contact"
						disabled={
							create.isPending ||
							firstName.trim() === "" ||
							!instagramCheck.success
						}
					>
						{create.isPending ? <Spinner /> : null}
						Crear contacto
					</Button>
					<SheetClose asChild>
						<Button variant="outline">Cancelar</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
