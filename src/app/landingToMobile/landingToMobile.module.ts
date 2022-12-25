import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';

import { LandingToMobileRoutingModule } from './landingToMobile-routing.module';
import { LandingToMobileComponent } from './landingToMobile.component';
import { BrowserService } from '@app/shared/services/browser.service';

@NgModule({
  imports: [SharedModule, LandingToMobileRoutingModule],
  declarations: [LandingToMobileComponent],
  providers: [BrowserService]
})
export class LandingToMobileModule {}
