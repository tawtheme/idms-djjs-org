export interface Sewa {
    id: string;
    uuid?: string;
    name: string;
    type: string;
    status?: string; // 'Active' | 'Inactive'
    createdAt: string;
}
