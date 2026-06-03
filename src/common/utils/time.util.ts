export function parseTimeToMilliseconds(timeString: string): number {
	const timeMatch = RegExp(/^(\d+)([smhd])$/).exec(timeString);
	if (!timeMatch) {
		throw new Error(`Invalid time format: ${timeString}. Use format like "10h", "7d", "1m"`);
	}

	const value = parseInt(timeMatch[1]);
	const unit = timeMatch[2];

	switch (unit) {
		case 's': // seconds
			return value * 1000;
		case 'm': // minutes
			return value * 60 * 1000;
		case 'h': // hours
			return value * 60 * 60 * 1000;
		case 'd': // days
			return value * 24 * 60 * 60 * 1000;
		default:
			throw new Error(`Unsupported time unit: ${unit}`);
	}
}
