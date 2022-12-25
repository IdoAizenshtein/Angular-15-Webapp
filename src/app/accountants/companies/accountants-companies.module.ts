import {NgModule} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';

import {AccountantsCompaniesRoutingModule} from './accountants-companies-routing.module';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {FilterPipe, FilterPipeBiggerSmaller} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        AccountantsCompaniesRoutingModule
    ],
    declarations: [],
    exports: [],
    providers: [
        SumPipe,
        DatePipe,
        CurrencyPipe,
        CurrencySymbolPipe,
        FilterPipe,
        FilterPipeBiggerSmaller,
        SortPipe,
        TodayRelativeHumanizePipe
    ]
})
export class AccountantsCompaniesModule {
}
