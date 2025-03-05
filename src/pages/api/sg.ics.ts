/** @file src/pages/api/sg.ics.ts */
export const prerender = false;

import type { APIContext, APIRoute } from 'astro'
import { getCollection } from "astro:content";
import ics from 'ics';
import { Temporal } from '@js-temporal/polyfill';

const prayerTimeCollection = await getCollection("SG_Singapore");
const data = prayerTimeCollection.map(o => o.data);

export const GET: APIRoute = async (context: APIContext) => {
	const url = context.url
	const paramContentType = url.searchParams.get('content-type');
	const paramShow = url.searchParams.get('show');

	if (paramContentType === 'json')
		if (paramShow === 'full')
			return new Response(JSON.stringify(data), {
				headers: { 'Content-Type': 'application/json' }
			});

	// Get current date in the timezone
	let nowZoned = Temporal.Now.zonedDateTimeISO('Asia/Singapore')
	const nowMilliseconds = nowZoned.epochMilliseconds;

	// Get unix timestamp for yesterday, today, and day after tomorrow
	const startOfYesterday = nowZoned.subtract({ days: 1 })
	                                 .startOfDay()
	                                 .epochMilliseconds;

	const startOfDayAfterTomorrow = nowZoned.add({ days: 2 })
	                                        .startOfDay()
	                                        .epochMilliseconds;

	/* More idiomatic implementation for reference
	// Filter data to include yesterday, today, and tomorrow,
	// and create icalendar events
	let dataFiltered = JSON.parse(JSON.stringify(
		data.filter(({ startOfDayEpochMilliseconds: entry }) =>
			startOfYesterday <= entry                              &&
			                    entry < startOfDayAfterTomorrow
		)
	)).map((entry: Entry) => ({
		...entry,
		events: entry.events.filter((event: any) => event.start > nowMilliseconds)
	}));
	const icsEvents = data.flatMap((day: any) =>
		day.events.map((event: any) => ({
			uid: event.uid,
			title: event.title,
			start: event.start,
			end: event.start,
		}))
	);
	*/

	// Filter data to include yesterday, today, and tomorrow
	// and create icalendar events
	const icsEvents: ics.EventAttributes[] = [];
	for (let i = 0; i < data.length; i++) {
		const entry = data[i];
		const entryTime = entry.startOfDayEpochMilliseconds;

		if (entryTime < startOfYesterday || entryTime >= startOfDayAfterTomorrow) {
			data.splice(i, 1);
			i--;
			continue;
		}

		const events = entry.events;
		for (let j = 0; j < events.length; j++) {
			if (events[j].start as number <= nowMilliseconds) events.splice(j, 1);
			else icsEvents.push(events[j]);
		}
	}

	if (paramContentType === 'json') {
		return new Response(JSON.stringify(data), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// ---------------------------------------------------------------------------
	// Return icalendar

	// Create iCalendar file
	const { error, value } = ics.createEvents(icsEvents);
	if (error) {
		console.error(error);
		return new Response(`Error creating iCalendar file: ${error}`, { status: 500 });
	}

	if (paramContentType === 'ics')
		return new Response(value, {
			headers: {
				'Content-Type': 'text/calendar',
				'Content-Disposition': 'attachment; filename="prayer-times.ics"',
			}
		});

	return new Response(value, {
		headers: {
			'Content-Type': 'text/plain',
		}
	});
}
