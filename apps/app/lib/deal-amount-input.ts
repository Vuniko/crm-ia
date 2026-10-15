const MAX_AMOUNT_CENTS = 99_999_999_999_999;

export function parseDealAmount(input: string): number | null | undefined {
	const value = input.trim();
	if (value === "") return null;
	if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return undefined;
	const [whole, fraction = ""] = value.replace(",", ".").split(".");
	const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
	return Number.isSafeInteger(cents) && cents <= MAX_AMOUNT_CENTS
		? cents
		: undefined;
}
