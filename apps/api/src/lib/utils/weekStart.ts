export function getWeekStart(date: Date = new Date()): Date {
	const taipeiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
	const day = taipeiDate.getDay();
	const diffToMonday = day === 0 ? -6 : 1 - day;
	taipeiDate.setDate(taipeiDate.getDate() + diffToMonday);
	taipeiDate.setHours(0, 0, 0, 0);
	return taipeiDate;
}
