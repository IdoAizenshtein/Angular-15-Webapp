export function compareDates(date: Date, dateToCompare: Date): boolean {
    return (
        date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) ===
        dateToCompare.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    );
}
