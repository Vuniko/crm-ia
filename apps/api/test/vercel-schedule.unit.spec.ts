import { expect, it } from "bun:test";
import config from "../vercel.json";

it("keeps scheduled jobs compatible with the Hobby daily execution limit", () => {
	for (const job of config.crons) {
		const [minute, hour, day, month, weekday] = job.schedule.split(" ");
		expect(
			Number.isInteger(Number(minute)) &&
				Number(minute) >= 0 &&
				Number(minute) <= 59,
		).toBe(true);
		expect(
			Number.isInteger(Number(hour)) && Number(hour) >= 0 && Number(hour) <= 23,
		).toBe(true);
		expect([day, month, weekday]).toEqual(["*", "*", "*"]);
	}
});
