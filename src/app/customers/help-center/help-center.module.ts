import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpCenterRoutingModule } from './help-center-routing.module';
import { CustomersHelpCenterComponent } from './customers-help-center/customers-help-center.component';
import { SharedModule } from '@app/shared/shared.module';
import { CustomerHelpVideoComponent } from './customer-help-video/customer-help-video.component';
import { PlayVideoDialogComponent } from './customer-help-video/play-video-dialog/play-video-dialog.component';
import { CustomersHelpFaqComponent } from './customers-help-faq/customers-help-faq.component';
import { CustomerHelpBySectionComponent } from './customer-help-by-section/customer-help-by-section.component';
import { FilterSearchablesPipe } from './shared/filter-searchables.pipe';
import { CustomersHelpTermComponent } from './customers-help-term/customers-help-term.component';
import { SectionIconSrcPipe } from './shared/section-icon-src.pipe';

// import { ServiceCallDialogComponent } from './customers-help-center/service-call-dialog/service-call-dialog.component';

@NgModule({
  imports: [CommonModule, SharedModule, HelpCenterRoutingModule],
  declarations: [
    CustomersHelpCenterComponent,
    CustomerHelpVideoComponent,
    CustomersHelpFaqComponent,
    CustomerHelpBySectionComponent,
    FilterSearchablesPipe,
    CustomersHelpTermComponent,
    SectionIconSrcPipe
  ],
  providers: [FilterSearchablesPipe]
})
export class HelpCenterModule {}
