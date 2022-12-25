import {NgModule} from '@angular/core';
import {AccountantsRoutingModule} from './accountants-routing.module';
import {SharedService} from '@app/shared/services/shared.service';
import {
    MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS,
    MatLegacyTooltipDefaultOptions as MatTooltipDefaultOptions
} from '@angular/material/legacy-tooltip';
import {EmptyComponent} from '@app/accountants/companies/empty.component';

/** Custom options the configure the tooltip's default show/hide delays. */
export const matTooltipDefaults: MatTooltipDefaultOptions = {
    showDelay: 600, // 30000,
    hideDelay: 100,
    touchendHideDelay: 100
};

@NgModule({
    imports: [AccountantsRoutingModule],
    declarations: [EmptyComponent],
    providers: [
        SharedService,
        {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: matTooltipDefaults}
    ]
})
export class AccountantsModule {
}
