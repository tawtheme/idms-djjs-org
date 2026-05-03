export type SortDirection = 'asc' | 'desc';

export function applyTableSort<T>(rows: T[], field: keyof T | string, direction: SortDirection): T[] {
    if (!field || !rows?.length) return rows ?? [];
    const dir = direction === 'desc' ? -1 : 1;
    const key = field as keyof T;
    return [...rows].sort((a, b) => {
        const av = (a as any)?.[key];
        const bv = (b as any)?.[key];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        const an = Number(av);
        const bn = Number(bv);
        if (!Number.isNaN(an) && !Number.isNaN(bn) && String(av).trim() !== '' && String(bv).trim() !== '') {
            return (an - bn) * dir;
        }
        return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) * dir;
    });
}
