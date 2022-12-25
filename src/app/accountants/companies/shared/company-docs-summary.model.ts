export class CompanyDocsSummary {
    companyId: string;
    byStatusSummary: {
        [key: string]: number;
    };
    flag: boolean;
    esderMaam: 'MONTH' | 'TWO_MONTH' | 'NONE';
}
