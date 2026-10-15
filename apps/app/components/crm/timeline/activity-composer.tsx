"use client";

import Calendar from "@carbon/icons-react/es/Calendar";
import { Calendar as DayPicker } from "@crm/ui/components/calendar";
import { Field, FieldDescription, FieldLabel } from "@crm/ui/components/field";
import { Icon } from "@crm/ui/components/icon";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@crm/ui/components/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@crm/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@crm/ui/components/select";
import { Spinner } from "@crm/ui/components/spinner";
import { ToggleGroup, ToggleGroupItem } from "@crm/ui/components/toggle-group";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { activityLabel } from "@/lib/activity-presentation";
import {
	INTERACTION_CHANNELS,
	type InteractionChannel,
	interactionContent,
} from "@/lib/interaction-channels";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";
import { ActivityIcon } from "./activity-icon";
import type { TimelineAnchor } from "./timeline";

const TYPES = ["NOTE", "CALL", "EMAIL", "MEETING", "TASK"] as const;

type ComposableType = (typeof TYPES)[number];

const dueFormat = new Intl.DateTimeFormat("es-PE", {
	month: "short",
	day: "numeric",
});

const PLACEHOLDER = {
	NOTE: "Registra la consulta, producto, talla, color y próximo paso…",
	CALL: "¿Qué acordaron en la llamada?",
	EMAIL: "¿Qué conversaron por correo?",
	MEETING: "¿Qué acordaron en la reunión?",
	TASK: "¿Qué seguimiento necesita el cliente?",
} satisfies Record<ComposableType, string>;

export function ActivityComposer({ anchor }: { anchor: TimelineAnchor }) {
	const trpc = useTRPC();
	const cache = useCrmCache();

	const [type, setType] = useState<ComposableType>("NOTE");
	const [draft, setDraft] = useState("");
	const [dueAt, setDueAt] = useState<Date | undefined>(undefined);
	const [channel, setChannel] = useState<InteractionChannel>("general");
	const channelId = useId();

	const isTask = type === "TASK";
	const text = draft.trim();

	const reset = () => {
		setDraft("");
		setDueAt(undefined);
	};

	const create = useMutation(
		trpc.activities.create.mutationOptions({
			onSuccess: async () => {
				await cache.activity();
				reset();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const submit = () => {
		if (text === "" || create.isPending) return;
		create.mutate({
			...anchor,
			type,
			...interactionContent(channel, text, isTask),
			dueAt: isTask ? (dueAt?.toISOString() ?? null) : undefined,
		});
	};

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<Field>
				<FieldLabel htmlFor={channelId}>Canal de interacción</FieldLabel>
				<Select
					value={channel}
					onValueChange={(value) => setChannel(value as InteractionChannel)}
					disabled={create.isPending}
				>
					<SelectTrigger id={channelId}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{INTERACTION_CHANNELS.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<FieldDescription>
					Registro manual. No envía mensajes ni sincroniza conversaciones.
				</FieldDescription>
			</Field>
			<InputGroup>
				<InputGroupTextarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder={PLACEHOLDER[type]}
					aria-label="Detalle de la interacción"
					disabled={create.isPending}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							submit();
						}
						if (event.key === "Escape") reset();
					}}
				/>

				<InputGroupAddon align="block-end" className="flex-wrap gap-2 border-t">
					<ToggleGroup
						type="single"
						value={type}
						onValueChange={(next) => next && setType(next as ComposableType)}
						size="sm"
						spacing={0}
						disabled={create.isPending}
						aria-label="Tipo de actividad"
						className="flex-wrap"
					>
						{TYPES.map((option) => (
							<ToggleGroupItem
								key={option}
								value={option}
								aria-label={activityLabel(option)}
							>
								<ActivityIcon type={option} />
								{activityLabel(option)}
							</ToggleGroupItem>
						))}
					</ToggleGroup>

					{isTask ? (
						<Popover>
							<PopoverTrigger asChild>
								<InputGroupButton
									variant="ghost"
									size="xs"
									disabled={create.isPending}
								>
									<Icon icon={Calendar} data-icon="inline-start" />
									{dueAt ? dueFormat.format(dueAt) : "Fecha de seguimiento"}
								</InputGroupButton>
							</PopoverTrigger>
							<PopoverContent size="fit" align="start">
								<DayPicker
									mode="single"
									selected={dueAt}
									onSelect={setDueAt}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					) : null}

					{text === "" ? null : (
						<InputGroupButton
							type="submit"
							variant="default"
							size="xs"
							className="ml-auto"
							disabled={create.isPending}
						>
							{create.isPending ? <Spinner /> : null}
							{isTask ? "Crear tarea" : "Registrar interacción"}
						</InputGroupButton>
					)}
				</InputGroupAddon>
			</InputGroup>
		</form>
	);
}
