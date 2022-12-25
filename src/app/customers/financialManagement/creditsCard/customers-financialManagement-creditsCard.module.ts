import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersFinancialManagementCreditsCardComponent } from './customers-financialManagement-creditsCard.component';

import { FinancialManagementCreditsCardAggregateComponent } from './aggregate/financialManagement-creditsCard-aggregate.component';
import { FinancialManagementCreditsCardDetailsComponent } from './details/financialManagement-creditsCard-details.component';
import { FinancialManagementCreditsCardGraphComponent } from './graph/financialManagement-creditsCard-graph.component';

import { CustomersFinancialManagementCreditsCardRoutingModule } from './customers-financialManagement-creditsCard-routing.module';

@NgModule({
    imports: [
        SharedModule,
        CommonModule,
        CustomersFinancialManagementCreditsCardRoutingModule
    ],
  declarations: [
    CustomersFinancialManagementCreditsCardComponent,
    FinancialManagementCreditsCardAggregateComponent,
    FinancialManagementCreditsCardDetailsComponent,
    FinancialManagementCreditsCardGraphComponent
  ]
})
export class CustomersFinancialManagementCreditsCardModule {}
