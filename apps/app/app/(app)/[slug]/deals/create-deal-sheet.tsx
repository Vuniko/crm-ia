"use client";

import Add from "@carbon/icons-react/es/Add";
import { CURRENCIES } from "@crm/db/currency";
import { Button } from "@crm/ui/components/button";
import { DatePicker } from "@crm/ui/components/date-picker";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";
import { type ComponentProps, Suspense, useId, useState } from "react";
import { toast } from "sonner";
import { CompanyPicker } from "@/components/crm/company-picker";
import { useOpenRecord } from "@/components/crm/record-sheet/record-stack";
import { parseDealAmount } from "@/lib/deal-amount-input";
import { dealStageLabel, OPEN_STAGES } from "@/lib/deal-stage";
import { SEARCH_PARAM } from "@/lib/search-param-keys";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

const UNSET = "";

function AddButton(props: ComponentProps<typeof Button>) {
	return (
		<Button {...props}>
			<Icon icon={Add} data-icon="inline-start" />
			Nueva oportunidad
		</Button>
	);
}

export function CreateDealSheet({ companyId }: { companyId?: string }) {
	return (
		<Suspense fallback={<AddButton disabled />}>
			<CreateDealForm companyId={companyId} />
		</Suspense>
	);
}

function CreateDealForm({ companyId }: { companyId?: string }) {
	const openRecord = useOpenRecord();
	const trpc = useTRPC();
	const cache = useCrmCache();

	const [open, setOpen] = useQueryState(
		SEARCH_PARAM.dialog.create,
		parseAsBoolean.withDefault(false),
	);
	const [name, setName] = useState("");
	const [company, setCompany] = useState(companyId ?? UNSET);
	const [ownerId, setOwnerId] = useState(UNSET);
	const [stage, setStage] =
		useState<(typeof OPEN_STAGES)[number]>("DEMO_BOOKED");
	const [amount, setAmount] = useState("");
	const [currency, setCurrency] = useState("");
	const [closeDate, setCloseDate] = useState("");

	const nameId = useId();
	const amountId = useId();
	const closeDateId = useId();

	const users = useQuery(trpc.users.list.queryOptions());
	const me = useQuery(trpc.users.me.queryOptions());
	const currencies = useQuery(trpc.currency.settings.queryOptions());

	const resolvedOwner = ownerId || me.data?.id || UNSET;
	const workspaceCurrency = currencies.data?.reportingCurrency;
	const resolvedCurrency = currency || workspaceCurrency || "USD";

	const create = useMutation(
		trpc.deals.create.mutationOptions({
			onSuccess: async (deal) => {
				await cache.deal(deal.id);
				toast.success(`${deal.name} creada.`);
				await setOpen(null);
				setName("");
				setAmount("");
				setCurrency("");
				setCloseDate("");
				setCompany(companyId ?? UNSET);
				setOwnerId(UNSET);
				setStage("DEMO_BOOKED");
				openRecord({ kind: "deal", id: deal.id });
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const amountCents = parseDealAmount(amount);
	const amountError = amountCents === undefined;
	const amountHelpId = useId();

	const ready =
		!amountError &&
		name.trim() !== "" &&
		company !== UNSET &&
		resolvedOwner !== UNSET;

	return (
		<Sheet open={open} onOpenChange={(next) => setOpen(next || null)}>
			<SheetTrigger asChild>
				<AddButton />
			</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Nueva oportunidad</SheetTitle>
					<SheetDescription>
						Registra el producto y el cliente. Selecciona una empresa y un
						responsable.
					</SheetDescription>
				</SheetHeader>

				<form
					id="create-deal"
					className="flex-1 overflow-y-auto px-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (!ready || create.isPending) return;
						create.mutate({
							name: name.trim(),
							companyId: company,
							ownerId: resolvedOwner,
							stage,
							amountCents,
							currency: currency || workspaceCurrency,
							expectedCloseDate: closeDate || null,
						});
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={nameId}>Nombre</FieldLabel>
							<Input
								id={nameId}
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Zapatillas urbanas · talla 39 · Ana"
								autoComplete="off"
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="create-deal-company">Empresa</FieldLabel>
							<CompanyPicker
								id="create-deal-company"
								value={company}
								onValueChange={setCompany}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="create-deal-owner">Responsable</FieldLabel>
							<Select value={resolvedOwner} onValueChange={setOwnerId}>
								<SelectTrigger id="create-deal-owner">
									<SelectValue placeholder="Selecciona un responsable" />
								</SelectTrigger>
								<SelectContent>
									{(users.data ?? []).map((user) => (
										<SelectItem key={user.id} value={user.id}>
											{user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field>
							<FieldLabel htmlFor="create-deal-stage">Etapa</FieldLabel>
							<Select
								value={stage}
								onValueChange={(value) =>
									setStage(value as (typeof OPEN_STAGES)[number])
								}
							>
								<SelectTrigger id="create-deal-stage">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{OPEN_STAGES.map((value) => (
										<SelectItem key={value} value={value}>
											{dealStageLabel(value)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldDescription>
								Selecciona una etapa abierta. Registra la venta ganada o perdida
								desde el proceso comercial.
							</FieldDescription>
						</Field>

						<Field data-invalid={amountError || undefined}>
							<FieldLabel htmlFor={amountId}>Importe</FieldLabel>
							<div className="flex gap-2">
								<Input
									id={amountId}
									aria-invalid={amountError || undefined}
									aria-describedby={amountHelpId}
									value={amount}
									onChange={(event) => setAmount(event.target.value)}
									placeholder="120,50"
									inputMode="decimal"
									autoComplete="off"
								/>
								<Select value={resolvedCurrency} onValueChange={setCurrency}>
									<SelectTrigger aria-label="Moneda" className="w-28 shrink-0">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CURRENCIES.map((entry) => (
											<SelectItem key={entry.code} value={entry.code}>
												{entry.code}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<FieldDescription
								id={amountHelpId}
								role={amountError ? "alert" : undefined}
							>
								{amountError
									? "Usa un importe positivo con hasta dos decimales y sin separadores de miles."
									: "Acepta 120,50 o 120.50. Déjalo vacío si aún no conoces el importe."}
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor={closeDateId}>
								Fecha estimada de cierre
							</FieldLabel>
							<DatePicker
								id={closeDateId}
								value={closeDate}
								onChange={setCloseDate}
								placeholder="Sin fecha"
							/>
						</Field>
					</FieldGroup>
				</form>

				<SheetFooter>
					<Button
						type="submit"
						form="create-deal"
						disabled={create.isPending || !ready}
					>
						{create.isPending ? <Spinner /> : null}
						Crear oportunidad
					</Button>
					<SheetClose asChild>
						<Button variant="outline">Cancelar</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
