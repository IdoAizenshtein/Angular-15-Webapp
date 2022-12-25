import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';

import {CommonModule} from '@angular/common';
import {UserService, UserServiceConfig} from './user.service';
import {TokenService} from './token.service';
import {ReportService} from './report.service';
import {MessagesService} from './messages.service';
import {ActionService} from './action.service';
import {AnalyticsService} from './analytics.service';
import {BeneficiaryService} from './beneficiary.service';
import {TransTypesService} from './transTypes.service';

@NgModule({
    imports: [CommonModule],
    providers: [
        UserService,
        TokenService,
        ReportService,
        MessagesService,
        ActionService,
        AnalyticsService,
        BeneficiaryService,
        TransTypesService
    ]
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error(
                'CoreModule is already loaded. Import it in the AppModule only'
            );
        }
    }

    static forRoot(config: UserServiceConfig): ModuleWithProviders<CoreModule> {
        return {
            ngModule: CoreModule,
            providers: [{provide: UserServiceConfig, useValue: config}]
        };
    }
}
