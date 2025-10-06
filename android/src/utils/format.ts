export function formatCurrency(amount: number, currency: string | null | undefined = 'RSD'): string {
	if (Number.isNaN(amount)) {
		return '—';
	}
	try {
		return new Intl.NumberFormat('sr-RS', {
			style: 'currency',
			currency: currency ?? 'RSD',
			minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch (e) {
		const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
		const suffix = currency ?? 'RSD';
		return `${rounded.toFixed(rounded % 1 === 0 ? 0 : 2)} ${suffix}`;
	}
}

export function formatDuration(minutes: number): string {
	if (!Number.isFinite(minutes) || minutes <= 0) {
		return '—';
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours === 0) {
		return `${minutes} min`;
	}
	if (mins === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${mins}min`;
}
