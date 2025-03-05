/** @file src/pages/dev/cf.ts */

export const prerender = false;
import type { APIContext, APIRoute } from 'astro';
import { Temporal as TemporalFullCalendar } from 'temporal-polyfill';
import { Temporal as TemporalProposal } from '@js-temporal/polyfill';

export const GET: APIRoute = async (context: APIContext) => {
	const request = context.request;

	const date = new Date();
	const dateEpoch = date.getTime();
	const FullCalendar = TemporalFullCalendar
		.Instant.fromEpochMilliseconds(dateEpoch);
	const Proposal = TemporalProposal
		.Instant.fromEpochMilliseconds(dateEpoch);

	// Date API outputs
	const dateISO = date.toISOString();
	const dateLocale = date.toLocaleString();
	// Manually create Singapore time with Date (+8 hours)
	const dateSingapore = new Date(dateEpoch);
	dateSingapore.setTime(dateSingapore.getTime() + (8 * 60 * 60 * 1000));
	const dateSingaporeISO = dateSingapore.toISOString().replace('Z', '+08:00');
	dateSingapore.getDay()

	const EXTRA = {
		headers: {
			"x-forwarded-for:": request.headers.get("x-forwarded-for"),
			"cf-connecting-ip:": request.headers.get("cf-connecting-ip"),
			"user-agent:": request.headers.get("user-agent"),
		},
		"new Date()": {
			locale: dateLocale,
			iso: dateISO,
			isoSingapore: dateSingaporeISO,
			epoch: dateEpoch,
		},
		"github.com/fullcalendar/temporal-polyfill": {
			iso: FullCalendar
				.toString(),
			isoSingapore: FullCalendar
				.toZonedDateTimeISO('Asia/Singapore')
				.toString(),
			epoch: FullCalendar
				.epochMilliseconds,
			epoch_sod: FullCalendar
				.toZonedDateTimeISO('Asia/Singapore')
				.startOfDay()
				.epochMilliseconds,
		},
		"github.com/js-temporal/temporal-polyfill": {
			iso: Proposal
				.toString(),
			isoSingapore: Proposal
				.toZonedDateTimeISO('Asia/Singapore')
				.toString(),
			epoch: Proposal
				.epochMilliseconds,
			epoch_sod: Proposal
				.toZonedDateTimeISO('Asia/Singapore')
				.startOfDay()
				.epochMilliseconds,
		},
	}

	const o = {
		...context,
		EXTRA
	}
	const response = JSON.stringify(o, null, 2);

	return new Response(response, {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
