import {Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {map, switchMap, tap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReportService} from '@app/core/report.service';

@Component({
    providers: [
        Location,
        {provide: LocationStrategy, useClass: PathLocationStrategy}
    ],
    templateUrl: './customers-packages.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CustomersPackagesComponent implements OnInit, OnDestroy {
    public popUpUpgrade: boolean = false;
    public loader: boolean = false;
    public popUpUpgradeCall: boolean = false;
    public showLastRowPopup: boolean = false;
    public subscriptionUpgrade: Subscription;
    public agreementPopup: any = {
        agreementConfirmation: null,
        agreementConfirmation_1: null,
        agreementConfirmation_2: null,
        sendMarketingInformation: null,
        agreementClicked: false,
        step: false
    };
    public METZALEMStep: number = 1;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    // @HostListener('window:resize', ['$event'])
    // onResize(event) {
    //     const width = event.target.innerWidth;
    //     const height = event.target.innerHeight;
    //     const outerHeight = event.target.screen.height;
    //     const outerWidth = event.target.screen.width;
    //     let scale;
    //     scale = Math.min((width) / outerWidth, (height - 85 - 45) / outerHeight);
    //     const elem = document.getElementsByClassName('scalePage');
    //     if (elem.length) {
    //         elem[0]['style'].webkitTransform = 'scale(' + scale + ')';
    //         elem[0]['style'].msTransform = 'scale(' + scale + ')';
    //         elem[0]['style'].transform = 'scale(' + scale + ')';
    //         elem[0]['style']['transform-origin'] = 'center top';
    //     }
    //     // console.log(scale);
    // }

    constructor(
        public location: Location,
        public userService: UserService,
        public sharedComponent: SharedComponent,
        public router: Router,
        private route: ActivatedRoute,
        public reportService: ReportService,
        private sharedService: SharedService
    ) {
        // breakpointObserver.observe([
        //     '(max-height: 959px) and (orientation: landscape)'
        // ]).subscribe(result => {
        //     console.log('result---', result);
        //     setTimeout(() => {
        //         const elem = document.getElementsByClassName('scalePage');
        //         if (elem.length) {
        //             if (result.matches) {
        //                 elem[0]['style'].webkitTransform = 'scale(0.7)';
        //                 elem[0]['style'].msTransform = 'scale(0.7)';
        //                 elem[0]['style'].transform = 'scale(0.7)';
        //                 elem[0]['style']['transform-origin'] = 'center top';
        //             } else {
        //                 elem[0]['style'].webkitTransform = 'scale(1)';
        //                 elem[0]['style'].msTransform = 'scale(1)';
        //                 elem[0]['style'].transform = 'scale(1)';
        //             }
        //         }
        //     }, 200);
        // });

        this.subscriptionUpgrade =
            sharedService.missionStartBusinessTrialOpen$.subscribe(() => {
                this.startBusinessTrialOpen();
            });
    }

    ngOnInit(): void {
        console.log('ngOnInit');
        // const event = window;
        // const width = event.innerWidth;
        // const height = event.innerHeight;
        // const outerHeight = event.screen.height;
        // const outerWidth = event.screen.width;
        // let scale;
        // scale = Math.min((width) / outerWidth, (height - 85 - 45) / outerHeight);
        // const elem = document.getElementsByClassName('scalePage');
        // if (elem.length) {
        //     elem[0]['style'].webkitTransform = 'scale(' + scale + ')';
        //     elem[0]['style'].msTransform = 'scale(' + scale + ')';
        //     elem[0]['style'].transform = 'scale(' + scale + ')';
        //     elem[0]['style']['transform-origin'] = 'center top';
        // }
        // console.log(scale);
    }

    startBusinessTrialOpen(): void {
        this.showLastRowPopup =
            this.userService.appData.userData.companySelect.billingAccountId !==
            '00000000-0000-0000-0000-000000000000';
        this.popUpUpgrade = true;
    }

    startBusinessTrialStep2(): void {
        this.loader = true;
        this.userService.appData.userData.companySelect.companyId = this.userService
            .appData.userData.companySelect.companyIdSaved
            ? this.userService.appData.userData.companySelect.companyIdSaved
            : this.userService.appData.userData.companySelect.companyId;
        this.sharedService
            .startTrialForDeskUser(
                this.userService.appData.userData.companySelect.companyId
            )
            .pipe(
                tap(() => (this.userService.appData.userData.companies = null)),
                switchMap((newCompanyId) => {
                    return this.sharedService
                        .getCompanies()
                        .pipe(
                            map((companiesResp) => [newCompanyId, (<any>companiesResp).body])
                        );
                })
            )
            .subscribe({
                next: ([newCompanyId, companies]) => {
                    this.userService.appData.showPopUpUpgrade = true;
                    this.userService.appData.userData.companies = companies;
                    this.userService.appData.userData.companies.forEach((companyData) => {
                        companyData.METZALEM =
                            this.userService.appData.userData.accountant === false &&
                            (companyData.privs.includes('METZALEM') ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('KSAFIM')) ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('ANHALATHESHBONOT')) ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('KSAFIM') &&
                                    companyData.privs.includes('ANHALATHESHBONOT')));
                        if (companyData.METZALEM) {
                            if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')
                            ) {
                                companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
                            } else if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM')
                            ) {
                                companyData.METZALEM_TYPE = 'KSAFIM';
                            } else if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')
                            ) {
                                companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
                            } else if (companyData.privs.includes('METZALEM')) {
                                companyData.METZALEM_TYPE = 'METZALEM';
                            }
                        }
                        companyData.METZALEM_deskTrialExpired =
                            companyData.METZALEM && !companyData.deskTrialExpired;
                        // companyData.METZALEM_deskTrialExpired = false;
                    });
                    this.userService.appData.userData.companySelect =
                        this.userService.appData.userData.companies.find(
                            (it) =>
                                it.companyId ===
                                this.userService.appData.userData.companySelect.companyId
                        );
                    // this.sharedService.announceMissionGetCompanies('newCompanies');
                    if (
                        this.userService.appData.userData.companySelect['METZALEM'] &&
                        !this.userService.appData.userData.companySelect[
                            'METZALEM_deskTrialExpired'
                            ]
                    ) {
                        this.sharedComponent.setNewNav();
                    }
                    this.sharedComponent.selectedValue =
                        this.userService.appData.userData.companySelect;
                    this.loader = false;
                    this.METZALEMStep = 2;
                }
            });
    }

    startBusinessTrialMetzalem(moveTo: string): void {
        const companySelect = this.userService.appData.userData.companies.find(
            (co) =>
                co.companyId ===
                this.userService.appData.userData.companySelect.companyId
        );
        this.sharedComponent.selectCompanyParam(companySelect, moveTo);
        // this.router.navigate([(!this.userService.appData.userData.accountant ? '/cfl/general' : '/accountants/companies')], {
        //     queryParamsHandling: 'preserve',
        //     relativeTo: this.route
        // });
        // this.userService.appData.userData.companySelect.companyId = this.userService.appData.userData.companySelect.companyIdSaved ? this.userService.appData.userData.companySelect.companyIdSaved : this.userService.appData.userData.companySelect.companyId;
        // this.sharedService.startBusinessTrial(this.userService.appData.userData.companySelect.companyId).pipe(
        //     tap(() => this.userService.appData.userData.companies = null),
        //     switchMap((newCompanyId) => {
        //         return this.sharedService.getCompanies()
        //             .pipe(
        //                 map((companiesResp) => [newCompanyId, (<any>companiesResp).body])
        //             );
        //     })
        // ).subscribe({
        //     next: ([newCompanyId, companies]) => {
        //         this.userService.appData.userData.companySelect.METZALEM = false;
        //         this.userService.appData.showPopUpUpgrade = true;
        //         this.userService.appData.userData.companies = companies;
        //         this.userService.appData.userData.companies.forEach(companyData => {
        //             companyData.METZALEM = this.userService.appData.userData.companySelect.companyId === companyData.companyId ? false :
        //                 (this.userService.appData.userData.accountant === false &&
        //                     (
        //                         (companyData.privs.length === 1 && companyData.privs[0] === 'METZALEM')
        //                         ||
        //                         (companyData.privs.length === 2 && companyData.privs.includes('METZALEM') && companyData.privs.includes('KSAFIM'))
        //                     )
        //                 );
        //         });
        //         this.sharedService.announceMissionGetCompanies('newCompanies');
        //         const companySelect = this.userService.appData.userData.companies.find(co => co.companyId === this.userService.appData.userData.companySelect.companyId);
        //         this.sharedComponent.selectCompanyParam(companySelect, moveTo);
        //         // this.router.navigate([(!this.userService.appData.userData.accountant ? '/cfl/general' : '/accountants/companies')], {
        //         //     queryParamsHandling: 'preserve',
        //         //     relativeTo: this.route
        //         // });
        //     }
        // });
    }

    startBusinessTrial(): void {
        this.showLastRowPopup =
            this.userService.appData.userData.companySelect.billingAccountId !==
            '00000000-0000-0000-0000-000000000000';
        this.popUpUpgrade = false;
        this.sharedService
            .startBusinessTrial(
                this.userService.appData.userData.companySelect.companyId
            )
            .pipe(
                tap(() => (this.userService.appData.userData.companies = null)),
                switchMap((newCompanyId) => {
                    return this.sharedService
                        .getCompanies()
                        .pipe(
                            map((companiesResp) => [newCompanyId, (<any>companiesResp).body])
                        );
                })
            )
            .subscribe({
                next: ([newCompanyId, companies]) => {
                    this.userService.appData.showPopUpUpgrade = true;
                    this.userService.appData.userData.companies = companies;
                    this.userService.appData.userData.companies.forEach((companyData) => {
                        companyData.METZALEM =
                            this.userService.appData.userData.accountant === false &&
                            (companyData.privs.includes('METZALEM') ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('KSAFIM')) ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('ANHALATHESHBONOT')) ||
                                (companyData.privs.includes('METZALEM') &&
                                    companyData.privs.includes('KSAFIM') &&
                                    companyData.privs.includes('ANHALATHESHBONOT')));
                        if (companyData.METZALEM) {
                            if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')
                            ) {
                                companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
                            } else if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM')
                            ) {
                                companyData.METZALEM_TYPE = 'KSAFIM';
                            } else if (
                                companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')
                            ) {
                                companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
                            } else if (companyData.privs.includes('METZALEM')) {
                                companyData.METZALEM_TYPE = 'METZALEM';
                            }
                        }
                        companyData.METZALEM_deskTrialExpired =
                            companyData.METZALEM && !companyData.deskTrialExpired;
                    });
                    this.sharedService.announceMissionGetCompanies('newCompanies');
                    this.router.navigate(
                        [
                            !this.userService.appData.userData.accountant
                                ? '/cfl/general'
                                : '/accountants/companies'
                        ],
                        {
                            queryParamsHandling: 'preserve',
                            relativeTo: this.route
                        }
                    );
                }
            });
    }

    async customerServiceUpgrade() {
        this.popUpUpgradeCall = true;
        const gRecaptcha = await this.userService.executeAction('customer-service-upgrade');
        this.sharedService
            .customerServiceUpgrade(
                this.userService.appData.userData.companySelect.companyId,
                gRecaptcha
            )
            .subscribe(() => {
            });
    }

    updateAgreementConfirmation(agreementPopup: any) {
        if (agreementPopup === false) {
            this.sharedService
                .updateAgreementConfirmation({
                    agreementConfirmation: null,
                    sendMarketingInformation: null,
                    agreementClicked: true,
                    companyId: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((response: any) => {
                });
        } else {
            if (agreementPopup.agreementConfirmation) {
                agreementPopup.agreementConfirmation = new Date(
                    Date.now()
                ).toISOString();
            }
            if (agreementPopup.sendMarketingInformation) {
                agreementPopup.sendMarketingInformation = new Date(
                    Date.now()
                ).toISOString();
            } else {
                agreementPopup.sendMarketingInformation = null;
            }
            this.agreementPopup.step = false;

            this.sharedService
                .updateAgreementConfirmation({
                    agreementConfirmation: agreementPopup.agreementConfirmation,
                    sendMarketingInformation: agreementPopup.sendMarketingInformation,
                    agreementClicked: false,
                    companyId: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((response: any) => {
                });
        }
    }

    printScreen() {
        this.reportService.reportIsProcessing$.next(true);
        setTimeout(() => {
            if (this.elemToPrint && this.elemToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.elemToPrint['nativeElement'],
                    'הסכם שימוש ומדיניות הפרטיות'
                );
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    ngOnDestroy() {
        this.subscriptionUpgrade.unsubscribe();
    }
}
