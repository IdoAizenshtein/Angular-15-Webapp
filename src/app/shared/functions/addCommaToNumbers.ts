// this function outputs '81,509.28' for input 81509.29 (last digit changes)
export function addCommaToNumbers(value: any): string {
    const n = 2;
    const f = Math.pow(10, n);
    return (Math.trunc(value * f) / f)
        .toFixed(n)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

export function formatAsSumNoMath(value: any): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const parts = value.toString().split('.');
    const fract = parts.length > 1 ? (parts[1] + '0').slice(0, 2) : '00';
    return parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '.' + fract;
}

export function formatWithoutPoints(value: any): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const parts = value.toString().split('.');
    return parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

export function roundAndAddComma(value: number | string): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const rounded = (typeof value === 'number' ? value : +value)
        .toFixed(0)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    return rounded === '-0' ? '0' : rounded;
}

export function toFixedFloat2NoMath(value: any): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const parts = value.toString().split('.');
    const fract = parts.length > 1 ? (parts[1] + '0').slice(0, 2) : '00';
    return parts[0] + '.' + fract;
}

export function toFixedNumber(value: any): number {
    if (value === null || typeof value === 'undefined') {
        return Number('');
    }
    return Number(Math.round((Number(value) + Number.EPSILON) * 100) / 100);
    // const parts = value.toString().split('.');
    // return parts.length > 1
    //     ? Number(parts[0] + '.' + (parts[1] + '0').slice(0, 2))
    //     : Number(parts[0]);
}

export function toNumber(value: any): number {
    if (value === null || typeof value === 'undefined') {
        return Number('');
    }
    return Number(value);
}
