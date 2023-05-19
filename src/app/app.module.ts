import {LOCALE_ID, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {AppComponent} from './app.component';
import {NavigatePageComponent} from './navigate-page.component';
import {AppRoutingModule} from './app-routing.module';
import {PageNotFoundComponent} from './not-found.component';
import {EmptyComponent} from './empty.component';
import {LocationStrategy, NgOptimizedImage, PathLocationStrategy, PlatformLocation, registerLocaleData} from '@angular/common';
import {DoneXhrService} from './shared/services/done.xhr.service';
import {AuthModule} from './login/auth.module';
import {BrowserModule} from '@angular/platform-browser';
import {ChunkLoadErrorInterceptor, TimingInterceptor} from './shared/services/http.interceptor';
import {CoreModule} from './core/core.module';
import {UserService} from './core/user.service';
import {SharedModule} from './shared/shared.module';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpServices} from './shared/services/http.services';
import {StorageService} from './shared/services/storage.service';
import {Angulartics2Module} from 'angulartics2';
import {RECAPTCHA_SETTINGS, RECAPTCHA_V3_SITE_KEY, RecaptchaSettings, RecaptchaV3Module} from 'ng-recaptcha';

// import { Angulartics2GoogleAnalytics } from 'angulartics2';
import {AuthService} from './login/auth.service';
import {SignupModule} from './signup/signup.module';
import {ActivationModule} from './activation/activation.module';
import {LandingToMobileModule} from './landingToMobile/landingToMobile.module';
import * as moment from 'moment-timezone';
import 'moment-timezone';
// import * as temp from 'moment';
// const momentDef = temp["default"];
import {AdminService} from './admin/admin.service';
import {AdminGuard} from './admin/admin-guard.service';
// import {environment} from '../environments/environment';
import {NewVersionAvailablePromptComponent} from './shared/component/new-version-available-prompt/new-version-available-prompt.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ErpModule} from './erp/erp.module';
import localeHe from '@angular/common/locales/he';
registerLocaleData(localeHe);

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(
        http,
        '../assets/i18n/',
        '.json?cb=' + new Date().getTime()
    );
}

@NgModule({
    imports: [
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        NgOptimizedImage,
        ActivationModule,
        ErpModule,
        LandingToMobileModule,
        AuthModule,
        SignupModule,
        BrowserModule,
        HttpClientModule,
        Angulartics2Module.forRoot(),
        CoreModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        SharedModule,
        NgbModule,
        RecaptchaV3Module
    ],
    declarations: [
        AppComponent,
        PageNotFoundComponent,
        EmptyComponent,
        NavigatePageComponent,
        NewVersionAvailablePromptComponent
    ],
    providers: [
        AuthService,
        HttpServices,
        DoneXhrService,
        StorageService,
        AdminService,
        AdminGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TimingInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ChunkLoadErrorInterceptor,
            multi: true
        },
        {provide: LocationStrategy, useClass: PathLocationStrategy},
        {provide: LOCALE_ID, useValue: 'he'},
        {provide: RECAPTCHA_V3_SITE_KEY, useValue: '6LfQ_z4kAAAAAL5Im2ERNTmRFb_yL7dA4g6uzN59'}
        // {
        //     provide: RECAPTCHA_SETTINGS,
        //     useValue: {siteKey: '6LfQ_z4kAAAAAL5Im2ERNTmRFb_yL7dA4g6uzN59', size: 'invisible'} as RecaptchaSettings
        // }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    public platformLocation: PlatformLocation;
    // private platformLocationMain: Location;
    private readonly listOfLocationAdmin: string[] = [
        'adm1.bizibox.biz',
        'dev-adm1.bizibox.biz',
        'stg-adm1.bizibox.biz',
        'dev2-adm2.bizibox.biz'
        // 'localhost'
        // ...(!environment.production ? ['localhost'] : [])
        // 'adm2-pre.bizibox.biz',
        // 'adm2-stg.bizibox.biz',
        // 'adm2.bizibox.biz',
        // '172.25.20.31',
        // 'adm.bizibox.biz',
        // 'adm-stg.bizibox.biz',
        // '172.25.100.31',
        // 'adm-pre.bizibox.biz',
        // '192.168.10.116',
        // '172.25.101.12'
    ];

    constructor(
        router: Router,
        platformLocation: PlatformLocation,
        public userService: UserService,
        private route: ActivatedRoute,
        storageService: StorageService,
        public adminService: AdminService
    ) {
        this.platformLocation = platformLocation;
        // this.platformLocationMain = this.platformLocation['location'];
        this.userService.appData.moment = moment.tz.setDefault('Asia/Jerusalem');
        // console.log(this.userService.appData.moment().format('llll'))

        this.userService.appData.isAdmin = this.listOfLocationAdmin.some(
            (loc) => this.platformLocation.hostname === loc
            // (loc) => this.platformLocationMain.hostname === loc
        );
        // this.userService.appData.isAdmin =
        //      (this.listOfLocationAdmin.every((x) => !this.platformLocationMain.host.includes(x))) === false;
        this.userService.appData.userOnBehalf = null;

        if (this.userService.appData.isAdmin) {
            try {
                const params = new URLSearchParams(this.platformLocation.search);
                // const params = new URLSearchParams(this.platformLocationMain.search);
                const queryParams: string = params.get('companyToSelect');
                if (queryParams) {
                    this.userService.appData.userOnBehalf = {
                        companyToSelect: queryParams,
                        id: params.get('id'),
                        name: params.get('name')
                    };
                    storageService.localStorageSetter(
                        'userOnBehalf',
                        JSON.stringify(this.userService.appData.userOnBehalf)
                    );
                }
                this.userService.appData.userOnBehalf = JSON.parse(
                    storageService.localStorageGetterItem('userOnBehalf')
                );
            } catch (e) {
            }
            this.userService.appData.userOnBehalfPrompt = {
                visible: !this.userService.appData.userOnBehalf,
                processing: false,
                onApprove: (userWithCompanyToSelect: string, type: any) => {
                    if (
                        userWithCompanyToSelect &&
                        (!this.userService.appData.userOnBehalf ||
                            [
                                this.userService.appData.userOnBehalf.id,
                                this.userService.appData.userOnBehalf.companyToSelect,
                                this.userService.appData.userOnBehalf.name
                            ].join('|') !== userWithCompanyToSelect ||
                            type === 'subscriptionNumber')
                    ) {
                        this.userService.appData.userOnBehalfPrompt.processing = true;
                        storageService.sessionStorageRemoveItem('selectedCompany$Settings');

                        const [userId, companyHp, userName] =
                            userWithCompanyToSelect.split('|');
                        this.userService.appData.userOnBehalf = {
                            id: userId,
                            name: userName,
                            companyToSelect: companyHp
                        };
                        storageService.localStorageSetter(
                            'userOnBehalf',
                            JSON.stringify(this.userService.appData.userOnBehalf)
                        );
                        this.adminService.switchUser(type);
                        this.userService.appData.userOnBehalfPrompt.processing = false;
                        // const [userId, companyHp] = userWithCompanyToSelect.split('|');
                        // this.adminService.usersToAdmin
                        //     .pipe(
                        //         tap((usrs) => {
                        //             this.userService.appData.userOnBehalf = {
                        //                 id: userId,
                        //                 name: usrs.find(usr => usr.userId === userId).userName,
                        //                 companyToSelect: companyHp
                        //             };
                        //             storageService.localStorageSetter('userOnBehalf',
                        //                 JSON.stringify(this.userService.appData.userOnBehalf));
                        //         })
                        //     )
                        //     .subscribe(() => {
                        //         this.adminService.switchUser();
                        //         this.userService.appData.userOnBehalfPrompt.processing = false;
                        //     });
                    } else {
                        this.userService.appData.userOnBehalfPrompt.visible = false;
                    }
                }
            };
        }

        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
    }
}
