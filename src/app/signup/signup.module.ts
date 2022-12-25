import { NgModule } from '@angular/core';
import { BrowserService } from '@app/shared/services/browser.service';
import { SignupComponent } from './signup/signup.component';
import { SignupRoutingModule } from './signup-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { SignupService } from './signup.service';
import { SignupMobileComponent } from './signup-mobile/signup-mobile.component';
import { BankOptionsDialogComponent } from './signup-mobile/bank-options/bank-options-dialog.component';
import { SignupAccountDataComponent } from './signup/account-data/signup-account-data.component';
import { SignupBusinessDataComponent } from './signup/business-data/signup-business-data.component';
import { SignupPersonalDataComponent } from './signup/personal-data/signup-personal-data.component';
import { SignupTokenTrackComponent } from './signup/token-track/signup-token-track.component';
import { SignupMobilePersonalDataComponent } from './signup-mobile/personal-data/signup-mobile-personal-data.component';
import { SignupMobileAccountDataComponent } from './signup-mobile/account-data/signup-mobile-account-data.component';
import { SignupMobileBusinessDataComponent } from './signup-mobile/business-data/signup-mobile-business-data.component';
import { SignupMobileTokenTrackComponent } from './signup-mobile/token-track/signup-mobile-token-track.component';

@NgModule({
  imports: [SharedModule, SignupRoutingModule],
  declarations: [
    SignupComponent,
    SignupPersonalDataComponent,
    SignupBusinessDataComponent,
    SignupAccountDataComponent,
    SignupTokenTrackComponent,
    SignupMobileComponent,
    BankOptionsDialogComponent,
    SignupMobilePersonalDataComponent,
    SignupMobileBusinessDataComponent,
    SignupMobileAccountDataComponent,
    SignupMobileTokenTrackComponent
  ],
  providers: [BrowserService, SignupService]
})
export class SignupModule {}
