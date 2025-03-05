/** @file src/content.config.ts */

import { defineCollection, z } from 'astro:content';
import { csvLoader } from "@ascorbic/csv-loader";
import { Temporal } from 'temporal-polyfill';
import ics from 'ics';
import { glob } from "astro/loaders";

const readme = defineCollection({
	loader: glob({ pattern: 'README.md', base: './' }),
});

const azanSchema = z.object({
	date: z.string(),             	// "2025-03-02"
	day: z.string(),              	// "Sat"
	imsak: z.string().nullable(), 	// "5:48" || ""
	subuh: z.string(),            	// "5:58"
	syuruk: z.string(),           	// "7:15"
	zohor: z.string(),            	// "13:19"
	asar: z.string(),             	// "16:31"
	maghrib: z.string(),          	// "19:21"
	isyak: z.string(),            	// "20:30"
})

const hourMinute = (prayerTime: string) =>
	prayerTime.split(':').map(i => Number.parseInt(i))

const defineAzan = (
	fileName: string,
	tzLike: Temporal.TimeZoneLike,
) => defineCollection({
	loader: csvLoader({ fileName }),
	schema: azanSchema.transform(o => {
		const [year, month, day] = o.date.split('-').map(i => Number.parseInt(i));
		const cityCountry = fileName.split('/').pop()!.split('.')[0]

		const createEvent = (
			title: string,
			prayerTime: string
		): ics.EventAttributes => {
			const [hour, minute] = hourMinute(prayerTime);
			const plainDateTime = new Temporal.PlainDateTime(year, month, day, hour, minute);
			const zoned = plainDateTime.toZonedDateTime(tzLike);
			const { epochMilliseconds: start } = zoned;
			return {
				uid: `${start}:${cityCountry}@azan.pages.dev`,
				title,
				start,
				end: start
			}
		}

		const plainDateTime = new Temporal.PlainDateTime(year, month, day);
		const startOfDayEpochMilliseconds = plainDateTime.toZonedDateTime(tzLike)
		                                                 .startOfDay()
		                                                 .epochMilliseconds;

		let events: ics.EventAttributes[] = [
			createEvent('Subuh', o.subuh),
			createEvent('Syuruk', o.syuruk),
			createEvent('Zohor', o.zohor),
			createEvent('Asar', o.asar),
			createEvent('Maghrib', o.maghrib),
			createEvent('Isyak', o.isyak),
		];
		if (!!o.imsak) {
			events = [createEvent('Imsak', o.imsak), ...events];
		}

		return {
			...o,
			startOfDayEpochMilliseconds,
			events
		}
	}),
})

export const collections = {
	readme,
	SG_Singapore: defineAzan(
		"src/data/country-city/SG_Singapore.csv",
		'Asia/Singapore'
	),
};
