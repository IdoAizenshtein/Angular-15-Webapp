import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersTazrimDailyComponent } from './customers-tazrim-daily.component';

import { TazrimDailyAggregateComponent } from './aggregate/tazrim-daily-aggregate.component';
import { TazrimDailyDetailsComponent } from './details/tazrim-daily-details.component';
import { TazrimDailyGraphComponent } from './graph/tazrim-daily-graph.component';

import { CustomersTazrimDailyRoutingModule } from './customers-tazrim-daily-routing.module';

@NgModule({
    imports: [SharedModule, CommonModule, CustomersTazrimDailyRoutingModule, NgOptimizedImage],
  declarations: [
    CustomersTazrimDailyComponent,
    TazrimDailyAggregateComponent,
    TazrimDailyDetailsComponent,
    TazrimDailyGraphComponent
  ]
})
export class CustomersTazrimDailyModule {}
