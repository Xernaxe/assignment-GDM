const fs = require('fs');

const getDataFromCSV = (filePath) => {
	const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
	const data = [];

	for (let i = 1; i < lines.length; i++) {
		const [capacity, price, startDay, endDay] = lines[i]
			.split(',')
			.map((s) => s.trim());
		data.push({
			capacity: parseInt(capacity, 10),
			price: parseFloat(price),
			startDay,
			endDay: endDay || undefined,
		});
	}

	return data;
};

const calculateRevenue = (targetDate, reservations) => {
	let revenue = 0;
	const oneDayInMs = 1000 * 60 * 60 * 24;

	const targetDateMonthStart = new Date(targetDate);
	const targetDateMonthEnd = new Date(
		targetDateMonthStart.getFullYear(),
		targetDateMonthStart.getMonth() + 1,
		0, // last day
		23, // hour
		59 // minute
	);

	reservations.forEach((reservation) => {
		const startDate = new Date(reservation.startDay);
		const endDate = reservation.endDay ? new Date(reservation.endDay) : null;

		const overlaps =
			startDate <= targetDateMonthEnd &&
			(!endDate || endDate >= targetDateMonthStart);

		if (!overlaps) return;

		const reservationOutboundsTargetMonthStart =
			startDate < targetDateMonthStart;

		const reservationOutboundsTargetMonthEnd =
			!endDate || endDate > targetDateMonthEnd;

		if (
			reservationOutboundsTargetMonthStart &&
			reservationOutboundsTargetMonthEnd
		) {
			revenue += reservation.price;
		} else {
			const daysInMonth = new Date(
				targetDateMonthStart.getFullYear(),
				targetDateMonthStart.getMonth() + 1,
				0
			).getDate();

			const pricePerDay = reservation.price / daysInMonth;

			const effectiveStartDate =
				startDate > targetDateMonthStart ? startDate : targetDateMonthStart;
			const effectiveEndDate =
				endDate && endDate < targetDateMonthEnd ? endDate : targetDateMonthEnd;

			// +1 in order to include both startDay & endDay
			// e.g (new Date('2025-05-31') - new Date('2025-05-01')) / oneDayInMs = 30, but we will consider both
			// the start day and end day as billed
			const noOfReservedDays =
				Math.floor((effectiveEndDate - effectiveStartDate) / oneDayInMs) + 1;

			revenue += pricePerDay * noOfReservedDays;
		}
	});

	return revenue;
};

// What is the total capacity of the unreserved offices for the month?An office is considered
// reserved if it was reserved even for a single day for the given month.
const calculateUnreservedCapacity = (targetDate, reservations) => {};

const main = () => {
	const reservations = getDataFromCSV('data-source.csv');
	const targetDates = ['2013-01', '2013-06', '2014-03', '2014-09', '2015-07'];
	// const targetDate = ['2013-01'];
	targetDates.forEach((date) => {
		const revenue = calculateRevenue(date, reservations);
		const unreservedCapacity = 0;

		console.log(
			`${date}: expected revenue: $${
				Number.isInteger(revenue) ? revenue : revenue.toFixed(2)
			}, expected total capacity of the unreserved offices: ${unreservedCapacity}`
		);
	});
};

main();
