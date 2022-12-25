import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { SharedService } from '@app/shared/services/shared.service';

import { CustomersRoutingModule } from './customers-routing.module';
import { ChecksViewComponent } from '@app/shared/component/transaction-additionals-view/checks-view/checks-view.component';
import { TransferViewComponent } from '@app/shared/component/transaction-additionals-view/transfer-view/transfer-view.component';
import {
  MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatLegacyTooltipDefaultOptions as MatTooltipDefaultOptions
} from '@angular/material/legacy-tooltip';
import { UnionViewComponent } from '@app/shared/component/transaction-additionals-view/union-view/union-view.component';
import { LoanDetailsPromptComponent } from '@app/shared/component/loan-details/loan-details-prompt.component';
import { TazrimExampleComponent } from './tazrimExample/tazrim-example.component';
import { landingPageMetzalemComponent } from './landingPageMetzalem/landing-page-metzalem.component';
import { ArchivesComponent } from '../accountants/companies/archives/archives.component';

export const matTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 600, // 30000,
  hideDelay: 100,
  touchendHideDelay: 100
};

@NgModule({
  imports: [SharedModule, CustomersRoutingModule],
  declarations: [TazrimExampleComponent, landingPageMetzalemComponent],
  providers: [
    SharedService,
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: matTooltipDefaults }
  ]
})
export class CustomersModule {}
