import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersFinancialManagementSlikaComponent } from './customers-financialManagement-slika.component';

import { FinancialManagementSlikaAggregateComponent } from './aggregate/financialManagement-slika-aggregate.component';
import { FinancialManagementSlikaDetailsComponent } from './details/financialManagement-slika-details.component';
import { FinancialManagementSlikaGraphComponent } from './graph/financialManagement-slika-graph.component';

import { CustomersFinancialManagementSlikaRoutingModule } from './customers-financialManagement-slika-routing.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersFinancialManagementSlikaRoutingModule
  ],
  declarations: [
    CustomersFinancialManagementSlikaComponent,
    FinancialManagementSlikaAggregateComponent,
    FinancialManagementSlikaDetailsComponent,
    FinancialManagementSlikaGraphComponent
  ]
})
export class CustomersFinancialManagementSlikaModule {}
