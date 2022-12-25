import {Pipe, PipeTransform} from '@angular/core';
import {CompanyDocsSummary} from './company-docs-summary.model';

@Pipe({
    name: 'statusCounterValueFetch'
})
export class StatusCounterValueFetchPipe implements PipeTransform {
    transform(
        companyDocsSummaries: Array<CompanyDocsSummary>,
        companyId: string,
        statusName: string
    ): string | number {
        const companySummary =
            !companyDocsSummaries || !companyId
                ? null
                : companyDocsSummaries.find((smry) => smry.companyId === companyId);

        if (!companySummary) {
            return '-';
        }

        return statusName in companySummary.byStatusSummary
            ? companySummary.byStatusSummary[statusName]
            : 0;
    }
}
