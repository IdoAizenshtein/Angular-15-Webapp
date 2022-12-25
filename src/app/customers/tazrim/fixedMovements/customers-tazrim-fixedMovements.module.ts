import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersTazrimFixedMovementsRoutingModule } from './customers-tazrim-fixedMovements-routing.module';
import { TazrimFixedMovementsDetailsComponent } from './details/tazrim-fixedMovements-details.component';
import { CustomersTazrimFixedMovementsComponent } from './customers-tazrim-fixedMovements.component';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersTazrimFixedMovementsRoutingModule
  ],
  declarations: [
    CustomersTazrimFixedMovementsComponent,
    TazrimFixedMovementsDetailsComponent
  ]
})
export class CustomersTazrimFixedMovementsModule {}
