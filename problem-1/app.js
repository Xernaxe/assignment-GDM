const fs = require('fs');

const areDatesOverlappingTarget = (
	startDate,
	endDate,
	targetStartDate,
	targetEndDate
) => {
	return startDate <= targetEndDate && (!endDate || endDate >= targetStartDate);
};

const getTargetDateMonthRange = (targetDate) => {
	const targetDateMonthStart = new Date(targetDate);
	const targetDateMonthEnd = new Date(
		targetDateMonthStart.getFullYear(),
		targetDateMonthStart.getMonth() + 1,
		0, // last day of the month
		23, // hour
		59 // minute
	);

	return [targetDateMonthStart, targetDateMonthEnd];
};

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

	const [targetDateMonthStart, targetDateMonthEnd] =
		getTargetDateMonthRange(targetDate);

	reservations.forEach((reservation) => {
		const startDate = new Date(reservation.startDay);
		const endDate = reservation.endDay ? new Date(reservation.endDay) : null;

		if (
			!areDatesOverlappingTarget(
				startDate,
				endDate,
				targetDateMonthStart,
				targetDateMonthEnd
			)
		)
			return;

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

const calculateUnreservedCapacity = (targetDate, reservations) => {
	const [targetDateMonthStart, targetDateMonthEnd] =
		getTargetDateMonthRange(targetDate);

	let unreservedCapacity = 0;

	reservations.forEach((reservation) => {
		const start = new Date(reservation.startDay);
		const end = reservation.endDay ? new Date(reservation.endDay) : null;

		if (
			!areDatesOverlappingTarget(
				start,
				end,
				targetDateMonthStart,
				targetDateMonthEnd
			)
		) {
			unreservedCapacity += reservation.capacity;
		}
	});

	return unreservedCapacity;
};

const main = () => {
	const reservations = getDataFromCSV('data-source.csv');
	const targetDates = ['2013-01', '2013-06', '2014-03', '2014-09', '2015-07'];

	targetDates.forEach((date) => {
		const revenue = calculateRevenue(date, reservations);
		const unreservedCapacity = calculateUnreservedCapacity(date, reservations);

		console.log(
			`${date}: expected revenue: $${
				Number.isInteger(revenue) ? revenue : revenue.toFixed(2)
			}, expected total capacity of the unreserved offices: ${unreservedCapacity}`
		);
	});
};

main();
