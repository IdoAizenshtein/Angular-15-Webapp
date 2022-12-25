import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersTazrimBankmatchComponent } from './customers-tazrim-bankmatch.component';

import { TazrimBankmatchBankComponent } from './movementsMatching/bank/tazrim-bankmatch-bank.component';
import { TazrimBankmatchCasflowComponent } from './movementsMatching/casflow/tazrim-bankmatch-casflow.component';
import { TazrimBankmatchMatchedMovementsComponent } from './matchedMovements/tazrim-bankmatch-matched-movements.component';

import { CustomersTazrimBankmatchRoutingModule } from './customers-tazrim-bankmatch-routing.module';

@NgModule({
  imports: [SharedModule, CommonModule, CustomersTazrimBankmatchRoutingModule],
  declarations: [
    CustomersTazrimBankmatchComponent,
    TazrimBankmatchBankComponent,
    TazrimBankmatchCasflowComponent,
    TazrimBankmatchMatchedMovementsComponent
  ]
})
export class CustomersTazrimBankmatchModule {}
