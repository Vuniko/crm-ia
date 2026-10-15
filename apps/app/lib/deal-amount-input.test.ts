import { describe, expect, it } from "bun:test";
import { parseDealAmount } from "./deal-amount-input";

describe("retail deal amounts", () => {
	it.each([
		["120,50", 12050],
		["120.50", 12050],
		[" 120,5 ", 12050],
		["0", 0],
		["0,01", 1],
		["1.01", 101],
		["999999999999.99", 99_999_999_999_999],
		["", null],
		["   ", null],
	])("converts %s without losing cents", (input, expected) => {
		expect(parseDealAmount(input)).toBe(expected);
	});

	it.each([
		"120abc",
		"120,50abc",
		"-10",
		"1e3",
		"Infinity",
		"NaN",
		"1.234,56",
		"1,234.56",
		"1,234",
		"12.345",
		".50",
		"12.",
		"1000000000000",
		"9999999999999999999999999999999999999",
	])("rejects invalid or ambiguous input %s", (input) => {
		expect(parseDealAmount(input)).toBeUndefined();
	});
});
