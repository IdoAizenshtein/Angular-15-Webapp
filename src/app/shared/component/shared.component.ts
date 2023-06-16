/* tslint:disable:max-line-length */
import {
    AfterViewInit,
    ApplicationRef,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EmbeddedViewRef,
    HostListener,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';
import {OverlayContainer} from '@angular/cdk/overlay';
import {UserService} from '@app/core/user.service';
import {TranslateService} from '@ngx-translate/core';
import {menu} from '@app/shared/config/menu';
import {ActivatedRoute, NavigationExtras, NavigationStart, Router, UrlSegment, UrlSegmentGroup, UrlTree} from '@angular/router';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {HttpServices} from '@app/shared/services/http.services';
import {AuthService} from '@app/login/auth.service';
import {BehaviorSubject, interval, merge, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {publishRef} from '../functions/publishRef';

import {SharedService} from '@app/shared/services/shared.service';

import {Dropdown} from 'primeng/dropdown/dropdown';
import {MenuItem} from 'primeng/api';
import {filter, map, startWith, switchMap, take, tap} from 'rxjs/operators';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {Message, MessagesService} from '@app/core/messages.service';
import {StorageService} from '@app/shared/services/storage.service';
import {TopNotificationAreaComponent} from './top-notification-area/top-notification-area.component';
import {BeneficiaryService} from '@app/core/beneficiary.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {LoanDetailsPromptComponent} from './loan-details/loan-details-prompt.component';
import Player from '@vimeo/player';
import {ReportService} from '@app/core/report.service';
import {Location} from '@angular/common';
import {AddCompanyDialogComponent} from '@app/shared/component/add-company-dialog/add-company-dialog-component';
import {LoanDetailsOverlayPromptComponent} from '@app/shared/component/transaction-additionals-view/loan-details-overlay/loan-details-overlay-prompt.component';

// import {sharedService} from './accountants.service';

@Component({
    templateUrl: '../templates/sidenav-responsive.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SharedComponent implements OnInit, AfterViewInit, OnDestroy {
    public menuArray: any = menu.customersLite;
    public isParent = false;
    public isParentChild = false;
    public isOpen: boolean;
    public dataFromBankAndCreditScreen: any;
    public isHover = false;
    public isHoverChild = false;
    public timeout: any;
    public _window: any = typeof window === 'object' && window ? window : null;
    public step = 99; // 0;
    public stepChild = 0;
    public modeNav = 'side';
    @Input() mode: any;
    public selectedValue: any;
    public typeOfCompany: number;
    public stateCtrl: FormControl;
    public filteredStates: Observable<any[]>;
    public switchMapInit: Observable<{}>;
    public itemsDD: MenuItem[];
    public getDataEvent: Subject<any> = new Subject<any>();
    public reloadMessagesEve: Subject<void> = new Subject<void>();

    public getDataEventGotAcc: Subject<any> = new Subject<any>();
    public getCompaniesEvent: Subject<any> = new Subject<any>();
    public reloadEvent: Subject<any> = new Subject<any>();
    public popUpReplaceMailShow: any = false;
    public popUpactivatedTypeBlockShow: any = false;
    public interval$: BehaviorSubject<number> = new BehaviorSubject(
        10 * 60 * 1000
    );

    public formMail: FormGroup | any;
    public hideMail = true;
    public mailUserBlock = '';
    public userCommentPrompt: {
        form: any;
        processing: boolean | null;
        visible: boolean;
    } | any;

    recommendationCalculatorShow = false;
    @ViewChild('rcmndtnCalendar') rcmndtnCalendar: any;
    public readonly recommendationPresetPublisher$ = new ReplaySubject<any>(1);

    messagesSideShow = false;
    openMessagesAgain = false;
    reloadMessagesSavedData;
    messagesSideHide = false;
    selectedCompanyPopupMessages$: Observable<Array<Message>>;
    knowledgeBaseVisible: any = false;
    companyId: any = false;
    isBank: any = true;
    nickname: any = false;
    showAddCompaniesPopUp = false;

    readonly knowledgeBaseIntroduction: { visible: boolean };
    readonly biziboxTrialExpired: { visible: number };
    readonly trialBlocked: { visible: number };
    readonly biziboxDowngradeDate: { visible: number };
    readonly budgetPopUpType: { visible: number };
    private transTypesSub: Subscription;

    @ViewChild(TopNotificationAreaComponent)
    topNotificationArea: TopNotificationAreaComponent;
    public readonly forceAccountsReload$ = new Subject<void>();
    subscriptionCompanies: Subscription;
    public subscriptionStatus: Subscription;

    private readonly budgetPromoVideoId = 390265215;
    budgetPromoVideo$: Observable<any>;
    private budgetPromoVideoPlayer: Player;

    public isCustomer = true;
    public isNoCompaniesFound = false;

    @ViewChild('budgetPromoVideoFrame')
    set budgetPromoVideoFrame(val: any) {
        if (val && val.nativeElement) {
            const relativeWidth = (Math.min(window.innerWidth, 1500) * 90) / 100; // take up to 90% of the screen size
            const relativeHeight = (relativeWidth * 9) / 16; // 16:9 to which we add 120 px for the dialog action buttons ("close")
            const overlayParent = val.nativeElement.parentElement.parentElement;
            overlayParent.style.width = relativeWidth + 'px';
            overlayParent.style.height = relativeHeight + 'px';
            this.budgetPromoVideoPlayer = new Player(val.nativeElement, {
                id: this.budgetPromoVideoId,
                // maxwidth: this.vimeoData.width, // 460,
                autoplay: true,
                // width: 480,
                // height: 240,
                // maxwidth: 480,
                // maxheight: 280,
                width: relativeWidth,
                height: relativeHeight // ,
                // responsive: true
            });
        }
    }

    public subscription: Subscription;
    scrWidth: any;

    @HostListener('window:resize', ['$event'])
    getScreenSize(event?: any) {
        this.scrWidth = window.innerWidth;
    }

    public showModalUpdateSystem: boolean = false;


    constructor(
        public router: Router,
        private _changeDetectionRef: ChangeDetectorRef,
        private _element: ElementRef,
        private _overlayContainer: OverlayContainer,
        public userService: UserService,
        public translate: TranslateService,
        public breakpointObserver: BreakpointObserver,
        public httpServices: HttpServices,
        public authService: AuthService,
        public reportService: ReportService,
        private route: ActivatedRoute,
        private sharedService: SharedService,
        private viewContainerRef: ViewContainerRef,
        private fb: FormBuilder,
        public snackBar: MatSnackBar,
        public messagesService: MessagesService,
        private storageService: StorageService,
        // private helpCenterService: HelpCenterService,
        private beneficiaryService: BeneficiaryService,
        private transTypesService: TransTypesService,
        private appRef: ApplicationRef,
        private injector: Injector,
        private httpClient: HttpClient,
        private location: Location
    ) {
        this.scrWidth = window.innerWidth;

        const url = this.location.path();
        const mainPath = this.getPathOfMainState(url);
        if (mainPath === 'api-account-management') {
            const queryParams: string = this.route.snapshot.queryParams['station_id'];
            const station_id =
                this.storageService.sessionStorageGetterItem('station_id');
            if (queryParams) {
                this.userService.appData.station_id = queryParams;
                this.storageService.sessionStorageSetter('station_id', queryParams);
            } else if (station_id) {
                this.userService.appData.station_id = station_id;
            }
            this.isOpen = false;
            this.router.navigate(['/api-account-management/main/manage'], {
                queryParamsHandling: '',
                relativeTo: this.route
            });
        } else {
            this.userService.appData.station_id = false;
            this.isCustomer = !this.userService.appData.userData.accountant;


            // this.userService.appData.userData.companySelect.METZALEM
            if (!this.isCustomer) {
                this.menuArray = menu.accountantsLite;
                this.step = 0;
            }

            breakpointObserver
                .observe(
                    !this.isCustomer
                        ? [Breakpoints.TabletLandscape, Breakpoints.HandsetLandscape]
                        : ['(max-width: 1280px) and (orientation: landscape)']
                )
                .subscribe((result) => {
                    console.log('breakpointObserver');
                    if (this.timeout) {
                        this._window.clearTimeout(this.timeout);
                    }
                    this.modeNav = 'side';
                    this.isOpen = !result.matches;
                    if (!this.isOpen) {
                        this.step = 99;
                    }
                });

            if (this.userService.appData.userData.accountant) {
                if (this.subscriptionStatus) {
                    this.subscriptionStatus.unsubscribe();
                }
                this.subscriptionStatus = this.interval$
                    .pipe(
                        switchMap((value) => interval(value)),
                        switchMap(() => this.sharedService.exporterFolderState())
                    )
                    .subscribe((response: any) => {
                        const countStatusData = response ? response['body'] : response;
                        this.userService.appData.expComputerName =
                            countStatusData && countStatusData.expComputerName
                                ? countStatusData.expComputerName
                                : '';

                        if (countStatusData && countStatusData.exporterState === 'NOT_OK') {
                            this.userService.appData.countStatusData = 'NOT_OK';
                            this.userService.appData.countStatusDataOldNOT_OK = false;
                            this.interval$.next(60 * 1000);
                        } else {
                            if (this.userService.appData.countStatusData === 'NOT_OK') {
                                this.userService.appData.countStatusDataOldNOT_OK = true;
                                setTimeout(() => {
                                    this.userService.appData.countStatusDataOldNOT_OK = false;
                                }, 5000);
                            }
                            this.userService.appData.countStatusData = 'OK';
                            if (
                                countStatusData &&
                                countStatusData.exporterState === 'NOT_EXIST'
                            ) {
                                this.interval$.next(60 * 1000);
                            } else {
                                this.interval$.next(10 * 60 * 1000);
                            }
                        }
                        this.userService.appData.folderState =
                            countStatusData && !!countStatusData.folderState
                                ? countStatusData.folderState
                                : null;
                        if (
                            this.userService.appData.userData.companySelect &&
                            this.userService.appData.userData.companySelect
                                .METZALEM_deskTrialExpired
                        ) {
                            this.userService.appData.exporterState = null;
                        } else {
                            this.userService.appData.exporterState =
                                countStatusData && !!countStatusData.exporterState
                                    ? countStatusData.exporterState
                                    : null;
                        }
                    });
            }

            this.knowledgeBaseIntroduction = Object.assign(
                {
                    visible: true
                },
                JSON.parse(
                    <string>(
                        this.storageService.localStorageGetterItem(
                            this.userService.appData.userData.userName +
                            '_knowledgeBaseIntroduction'
                        )
                    )
                )
            );
        }

        this.userCommentPrompt = {
            form: fb.group({
                userMessage: [null, Validators.required]
            }),
            processing: null,
            visible: false
        };

        this.biziboxTrialExpired = {
            visible: 0
        };
        this.trialBlocked = {
            visible: 0
        };
        this.biziboxDowngradeDate = {
            visible: 0
        };
        this.budgetPopUpType = {
            visible: 0
        };

        this.subscriptionCompanies = sharedService.missionAnnounced$.subscribe(
            (mission) => {
                if (mission === 'newCompanies') {
                    this.getCompanies();
                }
                if (mission === 'trialBlocked') {
                    this.trialBlocked.visible = 1;
                }
            }
        );
        if (new Date().getTime() < new Date(2021, 5, 24, 20).getTime()) {
            const hideModalUpdateSystem = this.storageService.localStorageGetterItem(
                'hideModalUpdateSystem'
            );
            if (hideModalUpdateSystem === null) {
                this.showModalUpdateSystem = true;
            }
        }
    }

    ngOnInit(): void {
        if (this.userService.appData.station_id) {
        } else {
            this.sharedService.getCompanies().subscribe((companies: any) => {
                this.userService.appData.userData.companies =
                    companies && companies.body ? companies.body : companies;
                this.userService.appData.userData.companies.forEach(
                    (companyData: any) => {
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
                        // companyData.deskTrialExpired = true;
                        // //1111
                        companyData.METZALEM_deskTrialExpired =
                            companyData.METZALEM && !companyData.deskTrialExpired;
                    }
                );
                let params = this.userService.appData.userData.mainCompanyId;
                const queryParams: string = this.route.snapshot.queryParams['id'];
                const companyToSelect: string =
                    this.route.snapshot.queryParams['companyToSelect'];
                if (companyToSelect) {
                    params = companyToSelect;
                } else if (queryParams) {
                    params = queryParams;
                } else {
                    const isMETZALEM = this.userService.appData.userData.companies.find(
                        (it) => it.METZALEM_deskTrialExpired
                    );
                    if (isMETZALEM) {
                        params = isMETZALEM.companyId;
                    }
                }
                this.getCompaniesEvent.next(true);
                this.sharedService.getCompany(params).subscribe((selectedValue) => {
                    this.selectedValue = selectedValue;

                    if (this.isCustomer) {
                        if (!this.selectedValue) {
                            this.selectedValue =
                                this.userService.appData.userData.companies[0];
                        }
                        if (this.userService.appData.userData.companies.length === 1) {
                            this.typeOfCompany = 1;
                        } else if (
                            this.userService.appData.userData.companies.length > 1 &&
                            this.userService.appData.userData.companies.length < 5
                        ) {
                            this.typeOfCompany = 2;
                        } else {
                            this.typeOfCompany = 3;
                        }
                        this.selectCompany();
                    } else {
                        if (this.selectedValue) {
                            this.selectCompany();
                        } else {
                            this.getDataEvent.next(true);
                        }
                    }
                    if (this.userService.appData.userData.accountant) {
                        this.sharedService.exporterFolderState().subscribe((response: any) => {
                            const countStatusData = response ? response['body'] : response;
                            this.userService.appData.expComputerName =
                                countStatusData && countStatusData.expComputerName
                                    ? countStatusData.expComputerName
                                    : '';

                            if (
                                countStatusData &&
                                countStatusData.exporterState === 'NOT_OK'
                            ) {
                                this.userService.appData.countStatusData = 'NOT_OK';
                                this.userService.appData.countStatusDataOldNOT_OK = false;
                                this.interval$.next(60 * 1000);
                            } else {
                                if (this.userService.appData.countStatusData === 'NOT_OK') {
                                    this.userService.appData.countStatusDataOldNOT_OK = true;
                                    setTimeout(() => {
                                        this.userService.appData.countStatusDataOldNOT_OK = false;
                                    }, 5000);
                                }
                                if (
                                    countStatusData &&
                                    countStatusData.exporterState === 'NOT_EXIST'
                                ) {
                                    this.interval$.next(60 * 1000);
                                } else {
                                    this.interval$.next(10 * 60 * 1000);
                                }
                                this.userService.appData.countStatusData = 'OK';
                            }
                            this.userService.appData.folderState =
                                countStatusData && !!countStatusData.folderState
                                    ? countStatusData.folderState
                                    : null;

                            if (
                                this.userService.appData.userData.companySelect &&
                                this.userService.appData.userData.companySelect
                                    .METZALEM_deskTrialExpired
                            ) {
                                this.userService.appData.exporterState = null;
                            } else {
                                this.userService.appData.exporterState =
                                    countStatusData && !!countStatusData.exporterState
                                        ? countStatusData.exporterState
                                        : null;
                            }
                        });
                    }
                });

                if (this.userService.appData.userData.taryePopup) {
                    this.tryToShowTaryaPopup();
                }
            });

            this.itemsDD = this.isCustomer
                ? [
                    {
                        label: this.translate.instant('actions.installTeamViewer'),
                        icon: 'fas fa-arrows-alt-h',
                        url: 'http://898.tv/bizibox',
                        target: '_blank',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.instant('actions.installTeamViewer')
                            });
                        }
                    },
                    {
                        label:
                        this.translate.translations[this.translate.currentLang].actions
                            .settings,
                        icon: 'fas fa-cog',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.translations[this.translate.currentLang].actions
                                    .settings
                            });
                            this.router.navigate(['./settings'], {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            });
                        }
                    },
                    {
                        label: this.translate.instant('actions.billing'),
                        icon: 'fas fa-shopping-cart',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.instant('actions.billing')
                            });
                            this.router.navigate(['./billing'], {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            });
                        }
                    },
                    {
                        label:
                        this.translate.translations[this.translate.currentLang].actions
                            .logOut,
                        icon: 'fa fa-sign-out-alt',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.translations[this.translate.currentLang].actions
                                    .logOut
                            });
                            this.authService.logout();
                        }
                    }
                ]
                : [
                    {
                        label:
                        this.translate.translations[this.translate.currentLang].actions
                            .companyProducts,
                        icon: 'icon-company_products',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.translations[this.translate.currentLang].actions
                                    .companyProducts
                            });
                            this.router.navigate(
                                ['/accountants/companies/companyProducts'],
                                {
                                    queryParamsHandling: 'preserve',
                                    relativeTo: this.route
                                }
                            );
                        }
                    },
                    {
                        label:
                        this.translate.translations[this.translate.currentLang].actions
                            .logOut,
                        icon: 'fa fa-sign-out-alt',
                        command: () => {
                            this.mixPanelEvent('my details', {
                                value: this.translate.translations[this.translate.currentLang].actions
                                    .logOut
                            });
                            this.authService.logout();
                        }
                    }
                ];

            if (this.userService.appData.isAdmin && this.isCustomer) {
                this.itemsDD.splice(-2, 0, {
                    label: this.translate.instant('actions.administration'),
                    icon: 'fas fa-fw fa-key',
                    command: () => {
                        this.mixPanelEvent('my details', {
                            value: this.translate.instant('actions.administration')
                        });
                        this.router.navigate(['./admin'], {
                            queryParamsHandling: 'preserve',
                            relativeTo: this.route
                        });
                    }
                });
            }

            this.selectedCompanyPopupMessages$ = merge(this.getDataEvent, this.reloadMessagesEve).pipe(
                startWith(true),
                switchMap(() =>
                    this.messagesService.getCompanyMessages({
                        companyAccountIds: [],
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        source: 'popup'
                    })
                ),
                tap((response: any) => {
                    this.openMessagesAgain = this.reloadMessagesSavedData && this.reloadMessagesSavedData.length !== response.length;
                    this.reloadMessagesSavedData = response;
                }),
                publishRef
            );

            this.route.paramMap
                .pipe(filter((params) => params.has('openTicket')))
                .subscribe((params) => {
                    const clearedParams = params.keys
                        .filter((k) => k !== 'openTicket')
                        .reduce((acmlr, k) => {
                            acmlr[k] = params.get(k);
                            return acmlr;
                        }, {});
                    this.router.navigate(['.', clearedParams], {
                        relativeTo: this.route
                    });

                    this.showOpenTicket();
                });

            // @ts-ignore
            // this.router.events.pipe(filter((e: Event): e is RouterEvent => e instanceof RouterEvent)).subscribe((e: RouterEvent) => {
            //     // Do something
            //     debugger
            // });

            this.budgetPromoVideo$ = this.httpClient
                .get(
                    `https://vimeo.com/api/oembed.json?url=https%3A//vimeo.com/${this.budgetPromoVideoId}`
                )
                .pipe(publishRef);
        }
    }

    getPathOfMainState(url: string): string {
        const tree: UrlTree = this.router.parseUrl(url);
        const g: UrlSegmentGroup = tree.root.children['primary'];
        const s: UrlSegment[] = g.segments;
        return s[0].path;
    }

    forceUnSelectedCompany(): void {
        this.selectedValue = null;
        delete this.userService.appData.userData.companySelect;
        setTimeout(() => {
            this.selectCompany(false, true);
        }, 600);
    }

    trackSystemUpdateId(idx: number, item: any) {
        return (item ? item.systemUpdateId : null) || idx;
    }

    setNameOfCompany(selectedValue, companies) {
        this.selectedValue = null;
        this.userService.appData.userData.companies = null;
        delete this.userService.appData.userData.companySelect;
        setTimeout(() => {
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
                // companyData.deskTrialExpired = true;
                // //1111
                companyData.METZALEM_deskTrialExpired =
                    companyData.METZALEM && !companyData.deskTrialExpired;
            });
            this.userService.appData.userData.companySelect = selectedValue;
            this.selectedValue = selectedValue;
        }, 10);
    }

    getCompanies(): void {
        let params = this.userService.appData.userData.mainCompanyId;
        const queryParams: string = this.route.snapshot.queryParams['id'];
        const companyToSelect: string =
            this.route.snapshot.queryParams['companyToSelect'];
        if (companyToSelect) {
            params = companyToSelect;
        } else if (queryParams) {
            params = queryParams;
        }
        this.sharedService.getCompany(params).subscribe((selectedValue) => {
            this.selectedValue = selectedValue;
            if (!this.selectedValue) {
                this.selectedValue = this.userService.appData.userData.companies[0];
            }
            if (this.userService.appData.userData.companies.length === 1) {
                this.typeOfCompany = 1;
            } else if (
                this.userService.appData.userData.companies.length > 1 &&
                this.userService.appData.userData.companies.length < 5
            ) {
                this.typeOfCompany = 2;
            } else {
                this.typeOfCompany = 3;
            }
            this.selectCompany();
        });

        if (this.userService.appData.userData.taryePopup) {
            this.tryToShowTaryaPopup();
        }
    }

    clearFilter(dropdown: Dropdown) {
        dropdown.resetFilter();
    }

    clickRecommendation(): void {
        if (!this.userService.appData.userData.companySelect.lite) {
            this.recommendationCalculatorShow = !this.recommendationCalculatorShow;
            this.mixPanelEvent('recomended payment');
            if (this.rcmndtnCalendar) {
                this.rcmndtnCalendar.reset();
            }
        } else {
            if (
                this.userService.appData.userData.companySelect.trialBlocked &&
                this.userService.appData.userData.companySelect.trialBlocked === true
            ) {
                this.sharedService.announceMissionGetCompanies('trialBlocked');
            } else {
                this.router.navigate(
                    [
                        !this.userService.appData.userData.accountant
                            ? '/cfl/packages'
                            : '/accountants/companies/packages'
                    ],
                    {
                        queryParamsHandling: 'preserve',
                        relativeTo: this.route
                    }
                );
            }
        }
    }

    clickCashFlow(): void {
        this.sharedService.announceMissionGetCompanies('trialBlocked');
    }

    clickBudget(isDiamond?: boolean): void {
        if (
            this.userService.appData.userData.companySelect.budgetExpiredDays === 0
        ) {
            this.budgetPopUpType.visible = 5;
        } else if (
            this.userService.appData.userData.companySelect.budgetExpiredDays > 0
        ) {
            if (isDiamond) {
                this.budgetPopUpType.visible = 5;
            } else {
                this.budgetPopUpType.visible = 0;
                this.router.navigate(
                    [
                        !this.userService.appData.userData.accountant
                            ? '/cfl/budget'
                            : '/accountants/companies/budget'
                    ],
                    {
                        queryParamsHandling: 'preserve'
                    }
                );
            }
        }
    }

    goToCompanyProducts(): void {
        // if (
        //     (this.userService.appData.userData.companySelect &&
        //         this.userService.appData.userData.companySelect.bankJournalItem) ||
        //     this.userService.appData.userData.companySelect.creditJournalItem
        // ) {
        //     this.router.navigate(
        //         ['/accountants/companies/journalTrans/bankAndCredit'],
        //         {
        //             queryParamsHandling: 'preserve'
        //         }
        //     );
        //     // creditJournalItem
        // } else {
        //     if (
        //         this.userService.appData.userData.companySelect &&
        //         this.userService.appData.userData.companySelect.companyId
        //     ) {
        //         this.storageService.localStorageSetter(
        //             'goToCompanyProducts',
        //             this.userService.appData.userData.companySelect.companyId
        //         );
        //     }
        //     this.router.navigate(['/accountants/companies/companyProducts'], {
        //         queryParamsHandling: 'preserve'
        //     });
        // }
    }

    startBusinessTrialOpen(): void {
        this.sharedService.startBusinessTrialOpen();
    }

    setNewNav(): void {
        this.step = 99;
        // this.menuArray = menu.METZALEM_open;
        if (
            this.userService.appData.userData.companySelect.METZALEM_TYPE ===
            'METZALEM' ||
            this.userService.appData.userData.companySelect.METZALEM_TYPE === 'KSAFIM'
        ) {
            if (this.userService.appData.userData.companySelect.METZALEM_TYPE === 'KSAFIM') {
                this.menuArray = menu.METZALEM_KSAFIM;
            } else {
                this.menuArray = menu.METZALEM_open;
            }
        } else if (
            this.userService.appData.userData.companySelect.METZALEM_TYPE ===
            'ANHALATHESHBONOT' ||
            this.userService.appData.userData.companySelect.METZALEM_TYPE ===
            'KSAFIM_ANHALATHESHBONOT'
        ) {
            if (this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM_ANHALATHESHBONOT') {
                this.menuArray = menu.METZALEM_KSAFIM_ANHALATHESHBONOT;
            } else {
                this.menuArray = menu.METZALEM_open_accountancy;
            }

        }
        this.userService.appData.userData.companySelect.lite = false;
    }

    mixPanelEvent(eventName: string, params?: any) {
        if (window['mixpanel']) {
            if (!params) {
                window['mixpanel'].track(eventName);
            } else {
                window['mixpanel'].track(eventName, params);
            }
        }
    }

    mixPanelNavEvent(routerLink: any) {
        // console.log('routerLink', routerLink);
        let mixPanelEvent: string | null = null;
        let mixPanelEventParams: any = false;
        switch (true) {
            case routerLink.includes('general'): {
                mixPanelEvent = 'tazrim general';
                mixPanelEventParams = {
                    'count': this.userService.appData.userData.accounts && Array.isArray(this.userService.appData.userData.accounts) ? this.userService.appData.userData.accounts.length : 0
                };
                break;
            }
            case routerLink.includes('fixedMovements/details'): {
                mixPanelEvent = 'trans kvuot';
                break;
            }
            case routerLink.includes('bankAccount'): {
                mixPanelEvent = 'my accounts';
                break;
            }
            case routerLink.includes('beneficiary'): {
                mixPanelEvent = 'mutavim';
                break;
            }
            case routerLink.includes('checks'): {
                mixPanelEvent = 'my checks';
                break;
            }
            case routerLink.includes('creditsCard'): {
                mixPanelEvent = 'my credits';
                break;
            }
            case routerLink.includes('slika'): {
                mixPanelEvent = 'solek accounts';
                mixPanelEventParams = {
                    'count': this.userService.appData.userData.slika && Array.isArray(this.userService.appData.userData.slika) ? this.userService.appData.userData.slika.length : 0
                };
                break;
            }
            case routerLink.includes('bankmatch/bank'): {
                mixPanelEvent = 'matche';
                break;
            }
            case routerLink.includes('budget'): {
                mixPanelEvent = 'budget screen';
                break;
            }
            case routerLink.includes('accountancy'): {
                mixPanelEvent = 'bookkeeping screen';
                break;
            }
            case routerLink.includes('help-center'): {
                mixPanelEvent = 'help center screen';
                break;
            }
            case routerLink.includes('cfl/settings'): {
                mixPanelEvent = 'settings screen';
                break;
            }
            case routerLink.includes('daily'): {
                mixPanelEvent = 'tazrim';
                break;
            }
            case routerLink === './companies': {
                mixPanelEvent = 'havarot';
                mixPanelEventParams = {
                    'new screen': this.userService.appData.isAdmin ? true : this.userService.appData.userData.showNewCompaniesPage
                };
                break;
            }
            case routerLink.includes('bankExport'): {
                mixPanelEvent = 'izu bank and credit';
                break;
            }
            case routerLink.includes('supplierCustomersJournal'): {
                mixPanelEvent = 'general sapakim velakohot';
                break;
            }
            case routerLink.includes('bankCreditJournal'): {
                mixPanelEvent = 'general bank and credit';
                break;
            }
            case routerLink.includes('reports'): {
                mixPanelEvent = 'dohot';
                break;
            }
            case routerLink.includes('./main'): {
                mixPanelEvent = 'rashi';
                break;
            }
            case routerLink.includes('companies/settings'): {
                mixPanelEvent = 'settings';
                break;
            }
        }
        if (mixPanelEvent) {
            this.mixPanelEvent(mixPanelEvent, mixPanelEventParams);
        }
    }

    selectCompanyParam(company: any, moveTo?: string): void {
        this.sharedService
            .getCompany(company.companyId)
            .subscribe((selectedValue) => {
                this.selectedValue = selectedValue;
                this.selectCompany(false, false, moveTo);
            });
    }

    mixScreenName(eventName: any) {
        if (window['mixpanel']) {
            const urlState: string = this.router.url.split('?')[0];
            // console.log(this.menuArray);
            let textScreen = '';
            this.menuArray.find((it: any) => {
                if (it.children.length) {
                    const findChildMatch = it.children.find((itChild: any) => {
                        if (itChild.routerLink) {
                            const urlFix = itChild.routerLink.replace('./', 'accountants/');
                            if (urlState.includes(urlFix)) {
                                return itChild;
                            }
                        } else {
                            if (itChild.children) {
                                const findNestedChildMatch = itChild.children.find((itNestedChild: any) => {
                                    const urlFix = itNestedChild.routerLink.replace('./', 'accountants/');
                                    if (urlState.includes(urlFix)) {
                                        return itChild;
                                    }
                                });
                                if (findNestedChildMatch) {
                                    textScreen = this.translate.instant(findNestedChildMatch.text);
                                    return itChild;
                                }
                            }
                        }
                    });
                    if (findChildMatch) {
                        textScreen = this.translate.instant(findChildMatch.text);
                        return findChildMatch;
                    }
                }
            });
            if (textScreen === '') {
                const findByParentMatch = this.menuArray.find((it: any) => {
                    if (!it.children.length) {
                        const urlFix = it.routerLink.replace('./', 'accountants/');
                        if (urlState.includes(urlFix)) {
                            return it;
                        }
                    }
                });
                if (findByParentMatch) {
                    textScreen = this.translate.instant(findByParentMatch.text);
                }
            }
            if (textScreen === 'חברות' && (this.userService.appData.isAdmin ? this.userService.appData.userDataAdmin.showNewCompaniesPage : this.userService.appData.userData.showNewCompaniesPage)) {
                textScreen += ' - כללי';
            }
            window['mixpanel'].track(eventName, {'screen name': textScreen || urlState});
        }
    }

    selectCompany(
        changeFromDD?: boolean,
        removeId?: boolean,
        moveTo?: string
    ): void {
        let isAlreadySelectedCompany = false;
        if (this.userService.appData.userData.companySelect) {
            isAlreadySelectedCompany = true;
        }
        this.userService.appData.userData.accountSelect = [];
        this.userService.appData.userData.accounts = [];
        this.storageService.sessionStorageRemoveItem(
            'journalTrans/bankAndCredit-filterDates-BANK'
        );
        this.storageService.sessionStorageRemoveItem('bankAndCredit-filterAcc');
        this.storageService.sessionStorageRemoveItem(
            'journalTrans/bankAndCredit-filterDates-CREDIT'
        );
        this.storageService.sessionStorageRemoveItem('journalTrans/*-filterCards');
        if (!moveTo) {
            this.storageService.sessionStorageRemoveItem('bankAndCreditScreenTab');
        }
        if (changeFromDD) {
            this.storageService.sessionStorageRemoveItem('accountants-doc-open');
        }
        this.userService.appData.userData.companySelect = this.selectedValue;
        if (window['mixpanel']) {
            // window['mixpanel'].register({
            //     "company name": this.userService.appData.userData.companySelect.companyName
            // });
            window['mixpanel'].set_group('company name', this.userService.appData.userData.companySelect.companyName);
            if (changeFromDD) {
                const urlState: string = this.router.url.split('?')[0];
                // console.log(this.menuArray);
                let textScreen = '';
                this.menuArray.find((it: any) => {
                    if (it.children.length) {
                        const findChildMatch = it.children.find((itChild: any) => {
                            if (itChild.routerLink) {
                                const urlFix = itChild.routerLink.replace('./', 'accountants/');
                                if (urlState.includes(urlFix)) {
                                    return itChild;
                                }
                            } else {
                                if (itChild.children) {
                                    const findNestedChildMatch = itChild.children.find((itNestedChild: any) => {
                                        const urlFix = itNestedChild.routerLink.replace('./', 'accountants/');
                                        if (urlState.includes(urlFix)) {
                                            return itChild;
                                        }
                                    });
                                    if (findNestedChildMatch) {
                                        textScreen = this.translate.instant(findNestedChildMatch.text);
                                        return itChild;
                                    }
                                }
                            }
                        });
                        if (findChildMatch) {
                            textScreen = this.translate.instant(findChildMatch.text);
                            return findChildMatch;
                        }
                    }
                });
                if (textScreen === '') {
                    const findByParentMatch = this.menuArray.find((it: any) => {
                        if (!it.children.length) {
                            const urlFix = it.routerLink.replace('./', 'accountants/');
                            if (urlState.includes(urlFix)) {
                                return it;
                            }
                        }
                    });
                    if (findByParentMatch) {
                        textScreen = this.translate.instant(findByParentMatch.text);
                    }
                }
                if (textScreen === 'חברות' && (this.userService.appData.isAdmin ? this.userService.appData.userDataAdmin.showNewCompaniesPage : this.userService.appData.userData.showNewCompaniesPage)) {
                    textScreen += ' - כללי';
                }
                window['mixpanel'].track('change company', {'screen name': textScreen || urlState});
            }
        }
        if (
            this.userService.appData.userData.companySelect &&
            this.userService.appData.userData.companySelect.METZALEM_deskTrialExpired
        ) {
            this.userService.appData.exporterState = null;
            this.itemsDD = [
                {
                    label:
                    this.translate.translations[this.translate.currentLang].actions
                        .logOut,
                    icon: 'fa fa-sign-out-alt',
                    command: () => {
                        this.mixPanelEvent('my details', {
                            value: this.translate.translations[this.translate.currentLang].actions
                                .logOut
                        });
                        this.authService.logout();
                    }
                }
            ];
            if (this.userService.appData.isAdmin && this.isCustomer) {
                this.itemsDD.splice(-2, 0, {
                    label: this.translate.instant('actions.administration'),
                    icon: 'fas fa-fw fa-key',
                    command: () => {
                        this.mixPanelEvent('my details', {
                            value: this.translate.instant('actions.administration')
                        });
                        this.router.navigate(['./admin'], {
                            queryParamsHandling: 'preserve',
                            relativeTo: this.route
                        });
                    }
                });
            }
        }
        if (!this.isCustomer && this.userService.appData.userData.companySelect) {
            this.userService.appData.userData.companyCustomerDetails = null;
            this.sharedService.companyCustomerDetails$ = null;

            this.sharedService
                .companyGetCustomer({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    sourceProgramId:
                    this.userService.appData.userData.companySelect.sourceProgramId
                })
                .subscribe((resp) => {
                    // userService.appData.userData.companyCustomerDetails.all
                    // userService.appData.userData.companyCustomerDetails.banksCards
                    // userService.appData.userData.companyCustomerDetails.cupa
                    // userService.appData.userData.companyCustomerDetails.cartisCodeId13
                    // userService.appData.userData.companyCustomerDetails.cartisCodeId14
                    // userService.appData.userData.companyCustomerDetails.cartisCodeId12
                    // userService.appData.userData.companyCustomerDetails.custMaamNechasim
                    // userService.appData.userData.companyCustomerDetails.custMaamTsumot
                    // userService.appData.userData.companyCustomerDetails.custMaamYevu
                    // userService.appData.userData.companyCustomerDetails.custMaamIska
                    // userService.appData.userData.companyCustomerDetails.supplierTaxDeduction
                    // userService.appData.userData.companyCustomerDetails.customerTaxDeduction
                });
        }
        const companyToSelect: string =
            this.route.snapshot.queryParams['companyToSelect'];
        const navigationExtras: NavigationExtras = removeId
            ? {
                queryParamsHandling: '',
                queryParams: {}
            }
            : {
                queryParams: !removeId ? {id: this.selectedValue.companyHp} : {},
                queryParamsHandling: companyToSelect ? null : 'merge',
                relativeTo: this.route
            };
        if (removeId) {
            const urlState: string = this.router.url.split('?')[0];
            this.router.navigate([`/${urlState}`], navigationExtras);
        } else {
            let goTo: any = [];
            if (this.isCustomer && this.selectedValue) {
                if (
                    this.userService.appData.userData.companySelect['METZALEM'] &&
                    !this.userService.appData.userData.companySelect[
                        'METZALEM_deskTrialExpired'
                        ]
                ) {
                    if (moveTo) {
                        goTo = [moveTo];
                        // navigationExtras = {
                        //     queryParamsHandling: 'preserve',
                        //     relativeTo: this.route
                        // };
                        // this.router.navigate([('/accountants/companies/settings/myaccount')], {
                        //     queryParamsHandling: 'preserve',
                        //     relativeTo: this.route
                        // });
                    } else {
                        if (
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM' &&
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM_ANHALATHESHBONOT'
                        ) {
                            goTo = ['./documentManagement/archives'];
                        } else {
                            // goTo = ['./general'];
                        }
                        this.step = 0;
                    }
                } else {
                    const urlState: string = this.router.url.split('?')[0];
                    if (
                        this.userService.appData.userData.companySelect
                            .METZALEM_deskTrialExpired
                    ) {
                        if (
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM' &&
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM_ANHALATHESHBONOT'
                        ) {
                            goTo = ['./documentManagement/archives'];
                        } else {
                            // goTo = ['./general'];
                        }
                    } else {
                        if (urlState === '/cfl/documentManagement/archives') {
                            goTo = ['./general'];
                        }
                    }
                }
            }
            if (!this.isCustomer && this.selectedValue) {
                if (moveTo && moveTo.includes('general/transType')) {
                    goTo = [moveTo];
                } else {
                    if (
                        this.userService.appData.userData.companySelect['METZALEM'] &&
                        !this.userService.appData.userData.companySelect[
                            'METZALEM_deskTrialExpired'
                            ]
                    ) {
                        if (moveTo) {
                            goTo = [moveTo];
                            // navigationExtras = {
                            //     queryParamsHandling: 'preserve',
                            //     relativeTo: this.route
                            // };
                            // this.router.navigate([('/accountants/companies/settings/myaccount')], {
                            //     queryParamsHandling: 'preserve',
                            //     relativeTo: this.route
                            // });
                        } else {
                            // goTo = ['./companies/archives'];
                            // this.step = 0;
                        }
                    } else {
                        if (
                            this.userService.appData.userData.companySelect
                                .METZALEM_deskTrialExpired
                        ) {
                            // goTo = ['./companies/archives'];
                            // moveTo = "archives";
                        } else {
                            if (changeFromDD) {
                                // navigationExtras.queryParams.tab = 'journal-trans';
                                // this.storageService.localStorageSetter('companiesTab', 'journal-trans');
                                if (
                                    this.userService.appData.userData.companySelect
                                        .supplierJournalItem
                                ) {
                                    // goTo = ['./companies/journalTrans'];
                                } else {
                                    // goTo = ['./companies/general/details'];
                                }
                                if (!isAlreadySelectedCompany) {
                                    goTo = ['./companies/general/details'];
                                }
                            } else {
                                if (moveTo) {
                                    this.storageService.localStorageSetter(
                                        'suppliersAndCustomersViewAsList',
                                        'true'
                                    );
                                    goTo = ['./companies/' + moveTo];
                                } else {
                                    const tab: string = this.route.snapshot.queryParams['tab'];
                                    if (tab) {
                                        if (tab === 'journal-trans') {
                                            goTo = ['./companies/journalTrans'];
                                        } else if (tab === 'general') {
                                            goTo = ['./companies/general'];
                                        } else if (tab === 'bank-export') {
                                            goTo = ['./companies/bankExport'];
                                        } else if (tab === 'matches') {
                                            goTo = ['./companies/archives'];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            this.router.navigate(goTo, navigationExtras);
        }


        if (
            this.userService.appData.userData.companySelect &&
            this.userService.appData.userData.companySelect['METZALEM'] &&
            !this.userService.appData.userData.companySelect[
                'METZALEM_deskTrialExpired'
                ]
        ) {
            if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'METZALEM'
            ) {
                this.menuArray = menu.METZALEM_open;
            } else if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'ANHALATHESHBONOT'
            ) {
                this.menuArray = menu.METZALEM_open_accountancy;
            } else if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM'
            ) {
                this.menuArray = menu.METZALEM_KSAFIM;
            } else if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM_ANHALATHESHBONOT'
            ) {
                this.menuArray = menu.METZALEM_KSAFIM_ANHALATHESHBONOT;
            }
            this.userService.appData.userData.companySelect.lite = false;
        } else {
            if (this.isCustomer) {
                if (this.userService.appData.userData.companySelect) {
                    if (
                        this.userService.appData.userData.companySelect
                            .METZALEM_deskTrialExpired
                    ) {
                        if (
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM' &&
                            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
                            'KSAFIM_ANHALATHESHBONOT'
                        ) {
                            this.menuArray =
                                menu[
                                    this.userService.appData.userData.companySelect
                                        .METZALEM_TYPE === 'METZALEM'
                                        ? 'METZALEM_close'
                                        : this.userService.appData.userData.companySelect
                                            .METZALEM_TYPE === 'ANHALATHESHBONOT'
                                            ? 'METZALEM_close_accountancy'
                                            : 'METZALEM_close'
                                    ];

                            this.router.events
                                .pipe(filter((event) => event instanceof NavigationStart))
                                .subscribe((event: any) => {
                                    // console.log('ssssss---', event.url);
                                    if (this.userService.appData && this.userService.appData.userData && this.userService.appData.userData.companySelect) {
                                        if (
                                            this.userService.appData.userData.companySelect[
                                                'METZALEM'
                                                ] &&
                                            !this.userService.appData.userData.companySelect[
                                                'METZALEM_deskTrialExpired'
                                                ]
                                        ) {
                                        } else {
                                            if (
                                                this.userService.appData.userData.companySelect
                                                    .METZALEM_deskTrialExpired
                                            ) {
                                                this.userService.appData.userData.companySelect.companyId =
                                                    this.userService.appData.userData.companySelect
                                                        .METZALEM_deskTrialExpired &&
                                                    this.userService.appData.userData.companySelect &&
                                                    this.selectedValue &&
                                                    this.selectedValue.example &&
                                                    !event.url.includes('accountancy') &&
                                                    !event.url.includes('archives') &&
                                                    !event.url.includes('tazrimExample')
                                                        ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
                                                        : this.userService.appData.userData.companySelect
                                                            .companyIdSaved
                                                            ? this.userService.appData.userData.companySelect
                                                                .companyIdSaved
                                                            : this.userService.appData.userData.companySelect
                                                                .companyId;
                                                console.log(
                                                    'this.userService.appData.userData.companySelect.companyId---',
                                                    this.userService.appData.userData.companySelect
                                                        .companyId
                                                );
                                            } else {
                                                this.itemsDD = this.isCustomer
                                                    ? [
                                                        {
                                                            label: this.translate.instant(
                                                                'actions.installTeamViewer'
                                                            ),
                                                            icon: 'fas fa-arrows-alt-h',
                                                            url: 'http://898.tv/bizibox',
                                                            target: '_blank',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.instant(
                                                                        'actions.installTeamViewer'
                                                                    )
                                                                });
                                                            }
                                                        },
                                                        {
                                                            label:
                                                            this.translate.translations[
                                                                this.translate.currentLang
                                                                ].actions.settings,
                                                            icon: 'fas fa-cog',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.translations[
                                                                        this.translate.currentLang
                                                                        ].actions.settings
                                                                });
                                                                this.router.navigate(['./settings'], {
                                                                    queryParamsHandling: 'preserve',
                                                                    relativeTo: this.route
                                                                });
                                                            }
                                                        },
                                                        {
                                                            label:
                                                                this.translate.instant('actions.billing'),
                                                            icon: 'fas fa-shopping-cart',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.instant('actions.billing')
                                                                });
                                                                this.router.navigate(['./billing'], {
                                                                    queryParamsHandling: 'preserve',
                                                                    relativeTo: this.route
                                                                });
                                                            }
                                                        },
                                                        {
                                                            label:
                                                            this.translate.translations[
                                                                this.translate.currentLang
                                                                ].actions.logOut,
                                                            icon: 'fa fa-sign-out-alt',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.translations[
                                                                        this.translate.currentLang
                                                                        ].actions.logOut
                                                                });
                                                                this.authService.logout();
                                                            }
                                                        }
                                                    ]
                                                    : [
                                                        {
                                                            label:
                                                            this.translate.translations[
                                                                this.translate.currentLang
                                                                ].actions.companyProducts,
                                                            icon: 'icon-company_products',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.translations[
                                                                        this.translate.currentLang
                                                                        ].actions.companyProducts
                                                                });
                                                                this.router.navigate(
                                                                    ['/accountants/companies/companyProducts'],
                                                                    {
                                                                        queryParamsHandling: 'preserve',
                                                                        relativeTo: this.route
                                                                    }
                                                                );
                                                            }
                                                        },
                                                        {
                                                            label:
                                                            this.translate.translations[
                                                                this.translate.currentLang
                                                                ].actions.logOut,
                                                            icon: 'fa fa-sign-out-alt',
                                                            command: () => {
                                                                this.mixPanelEvent('my details', {
                                                                    value: this.translate.translations[
                                                                        this.translate.currentLang
                                                                        ].actions.logOut
                                                                });
                                                                this.authService.logout();
                                                            }
                                                        }
                                                    ];
                                                if (this.userService.appData.isAdmin && this.isCustomer) {
                                                    this.itemsDD.splice(-2, 0, {
                                                        label: this.translate.instant(
                                                            'actions.administration'
                                                        ),
                                                        icon: 'fas fa-fw fa-key',
                                                        command: () => {
                                                            this.mixPanelEvent('my details', {
                                                                value: this.translate.instant(
                                                                    'actions.administration'
                                                                )
                                                            });
                                                            this.router.navigate(['./admin'], {
                                                                queryParamsHandling: 'preserve',
                                                                relativeTo: this.route
                                                            });
                                                        }
                                                    });
                                                }
                                                if (
                                                    this.userService.appData.userData.companySelect[
                                                        'biziboxType'
                                                        ] &&
                                                    this.userService.appData.userData.companySelect[
                                                        'biziboxType'
                                                        ] === 'regular'
                                                ) {
                                                    this.menuArray = menu.customersLite;
                                                    this.userService.appData.userData.companySelect.lite =
                                                        true;
                                                } else {
                                                    this.menuArray = menu.customers;
                                                    this.userService.appData.userData.companySelect.lite =
                                                        false;
                                                }
                                            }
                                        }
                                    }
                                });
                        } else {
                            if (
                                this.userService.appData.userData.companySelect
                                    .METZALEM_TYPE === 'KSAFIM_ANHALATHESHBONOT'
                            ) {
                                this.menuArray = menu.METZALEM_open_accountancy;
                            } else if (
                                this.userService.appData.userData.companySelect
                                    .METZALEM_TYPE === 'KSAFIM'
                            ) {
                                this.menuArray = menu.METZALEM_open;
                            }
                        }
                    } else {
                        if (
                            this.userService.appData.userData.companySelect['biziboxType'] &&
                            this.userService.appData.userData.companySelect['biziboxType'] ===
                            'regular'
                        ) {
                            this.menuArray = menu.customersLite;
                            this.userService.appData.userData.companySelect.lite = true;
                        } else {
                            this.menuArray = menu.customers;
                            this.userService.appData.userData.companySelect.lite = false;
                        }
                    }
                } else {
                    this.menuArray = menu.customers;
                }
            } else {
                if (this.userService.appData.userData.companySelect) {
                    if (
                        this.userService.appData.userData.companySelect['biziboxType'] &&
                        this.userService.appData.userData.companySelect['biziboxType'] ===
                        'regular'
                    ) {
                        this.menuArray = menu.accountantsLite;
                        this.userService.appData.userData.companySelect.lite = true;
                    } else {
                        this.menuArray = menu.accountants;
                        this.userService.appData.userData.companySelect.lite = false;
                    }
                } else {
                    this.menuArray = menu.accountants;
                }
            }
        }
        if (this.isCustomer && this.userService.appData.userData.companySelect &&
            this.userService.appData.userData.companySelect['METZALEM']) {
            if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM'
            ) {
                this.menuArray = menu.METZALEM_KSAFIM;
            } else if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM_ANHALATHESHBONOT'
            ) {
                this.menuArray = menu.METZALEM_KSAFIM_ANHALATHESHBONOT;
            }
            if (
                this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM' ||  this.userService.appData.userData.companySelect.METZALEM_TYPE ===
                'KSAFIM_ANHALATHESHBONOT'
            ){
                if (this.userService.appData.isAdmin){
                    this.itemsDD =  [
                        {
                            label: this.translate.instant('actions.administration'),
                            icon: 'fas fa-fw fa-key',
                            command: () => {
                                this.mixPanelEvent('my details', {
                                    value: this.translate.instant('actions.administration')
                                });
                                this.router.navigate(['./admin'], {
                                    queryParamsHandling: 'preserve',
                                    relativeTo: this.route
                                });
                            }
                        },
                        {
                            label: this.translate.instant('actions.billing'),
                            icon: 'fas fa-shopping-cart',
                            command: () => {
                                this.mixPanelEvent('my details', {
                                    value: this.translate.instant('actions.billing')
                                });
                                this.router.navigate(['./billing'], {
                                    queryParamsHandling: 'preserve',
                                    relativeTo: this.route
                                });
                            }
                        },
                        {
                            label:
                            this.translate.translations[this.translate.currentLang].actions
                                .logOut,
                            icon: 'fa fa-sign-out-alt',
                            command: () => {
                                this.mixPanelEvent('my details', {
                                    value: this.translate.translations[this.translate.currentLang].actions
                                        .logOut
                                });
                                this.authService.logout();
                            }
                        }
                    ]
                }else{
                    this.itemsDD =  [
                        {
                            label: this.translate.instant('actions.billing'),
                            icon: 'fas fa-shopping-cart',
                            command: () => {
                                this.mixPanelEvent('my details', {
                                    value: this.translate.instant('actions.billing')
                                });
                                this.router.navigate(['./billing'], {
                                    queryParamsHandling: 'preserve',
                                    relativeTo: this.route
                                });
                            }
                        },
                        {
                            label:
                            this.translate.translations[this.translate.currentLang].actions
                                .logOut,
                            icon: 'fa fa-sign-out-alt',
                            command: () => {
                                this.mixPanelEvent('my details', {
                                    value: this.translate.translations[this.translate.currentLang].actions
                                        .logOut
                                });
                                this.authService.logout();
                            }
                        }
                    ]
                }
            }
        }
        delete this.userService.appData.userData
            .companySelectedBillingStatusWarningAccepted;
        if (
            this.userService.appData.userData.companySelect &&
            ((Number.isFinite(
                        this.userService.appData.userData.companySelect.deskTrialExpired
                    ) &&
                    this.userService.appData.userData.companySelect.deskTrialExpired <=
                    14) ||
                (Number.isFinite(
                        this.userService.appData.userData.companySelect.daysLeftTillExpire
                    ) &&
                    this.userService.appData.userData.companySelect.daysLeftTillExpire <=
                    14 &&
                    (this.userService.appData.userData.companySelect.billingAccountId ===
                        '00000000-0000-0000-0000-000000000000' ||
                        (this.isCustomer &&
                            this.userService.appData.userData.companySelect
                                .billingAccountId !== '00000000-0000-0000-0000-000000000000' &&
                            this.userService.appData.userData.companySelect
                                .billingPaymentTypeId === 3))))
        ) {
            this.userService.appData.userData.companySelectedBillingStatus =
                this.userService.appData.userData.companySelect.deskTrialExpired ===
                0 ||
                ((this.userService.appData.userData.companySelect.billingAccountId ===
                        '00000000-0000-0000-0000-000000000000' ||
                        (this.isCustomer &&
                            this.userService.appData.userData.companySelect.billingAccountId !==
                            '00000000-0000-0000-0000-000000000000' &&
                            this.userService.appData.userData.companySelect
                                .billingPaymentTypeId === 3)) &&
                    this.userService.appData.userData.companySelect.daysLeftTillExpire ===
                    0)
                    ? 'RESTRICT'
                    : 'WARN';
            /*
                        this.userService.appData.userData.companySelectedBillingStatus =
                            (
                                (this.userService.appData.userData.companySelect['METZALEM'] && this.userService.appData.userData.companySelect.deskTrialExpired > 0)
                                ||
                                (!this.userService.appData.userData.companySelect['METZALEM'] && this.userService.appData.userData.companySelect.daysLeftTillExpire > 0)
                            )
                                ? 'WARN' : 'RESTRICT';
            */
            // if(this.userService.appData.userData.companySelect['METZALEM_deskTrialExpired']){
            //     this.userService.appData.userData.companySelectedBillingStatus = 'RESTRICT';
            // }
            if (
                this.userService.appData.userData.companySelect.billingAccountId !==
                '00000000-0000-0000-0000-000000000000' &&
                this.userService.appData.userData.companySelectedBillingStatus ===
                'WARN' &&
                this.isCustomer
            ) {
                this.userService.appData.userData.companySelectedBillingStatusWarningAccepted =
                    true;
            }
        } else {
            this.userService.appData.userData.companySelectedBillingStatus = null;
        }
        if (changeFromDD) {
            this.storageService.localStorageRemoveItem('closeSlideBudget');
        }
        if (this.userService.appData.userData.companySelect) {
            // debugger
            if (this.userService.appData.userData.companySelect.popupAlert) {
                const companyPopupAlertStorageKey = [
                    this.userService.appData.userData.companySelect.companyId,
                    'popupAlertShownAt',
                    'ttl'
                ].join('_');
                const companyPopupAlertLastShownAt =
                    this.storageService.localStorageGetterItem(
                        companyPopupAlertStorageKey
                    );
                this.userService.appData.userData.companySelect.companySelectPopupAlertShow =
                    !companyPopupAlertLastShownAt ||
                    this.userService.appData
                        .moment(+companyPopupAlertLastShownAt)
                        .isBefore(this.userService.appData.moment());
                if (
                    this.userService.appData.userData.companySelect
                        .companySelectPopupAlertShow
                ) {
                    this.storageService.localStorageSetter(
                        companyPopupAlertStorageKey,
                        this.userService.appData.moment().endOf('day').valueOf()
                    );
                }
            } else {
                this.userService.appData.userData.companySelect.companySelectPopupAlertShow =
                    false;
            }

            if (
                this.userService.appData.userData.companySelect.biziboxTrialExpired !==
                null
            ) {
                this.biziboxTrialExpired.visible = 1;
            } else {
                this.biziboxTrialExpired.visible = 0;
            }
            if (
                this.userService.appData.userData.companySelect.biziboxDowngradeDate !==
                null
            ) {
                this.biziboxDowngradeDate.visible = 1;
            } else {
                this.biziboxDowngradeDate.visible = 0;
            }

            if (
                this.userService.appData.userData.companySelect.budgetPopUpType !==
                null &&
                this.userService.appData.userData.companySelect.budgetPopUpType !== 0
            ) {
                if (
                    this.userService.appData.userData.companySelect.budgetPopUpType === 1
                ) {
                    this.budgetPopUpType.visible = 1;
                } else if (
                    this.userService.appData.userData.companySelect.budgetPopUpType ===
                    2 ||
                    this.userService.appData.userData.companySelect.budgetPopUpType === 3
                ) {
                    if (
                        this.userService.appData.userData.companySelect.budgetExpiredDays <=
                        7 &&
                        this.userService.appData.userData.companySelect.budgetExpiredDays >
                        0
                    ) {
                        this.budgetPopUpType.visible = 3;
                    } else if (
                        this.userService.appData.userData.companySelect.budgetPopUpType ===
                        2 &&
                        this.userService.appData.userData.companySelect.budgetExpiredDays >
                        7
                    ) {
                        this.budgetPopUpType.visible = 2;
                    }
                }
            } else {
                this.budgetPopUpType.visible = 0;
            }

            const urlState: string = this.router.url.split('?')[0];
            if (this.userService.appData.userData.companySelect.lite) {
                if (
                    urlState.includes('cash-flow/daily') ||
                    urlState.includes('cash-flow/bankmatch') ||
                    urlState.includes('cash-flow/fixedMovements') ||
                    urlState.includes('accountancy/bookKeepingAnalyze') ||
                    urlState.includes('accountancy/profitAndLoss') ||
                    urlState.includes('accountancy/trialBalance')
                ) {
                    if (
                        this.userService.appData.userData.companySelect.trialBlocked &&
                        this.userService.appData.userData.companySelect.trialBlocked ===
                        true
                    ) {
                        this.router.navigate(
                            [
                                !this.userService.appData.userData.accountant
                                    ? '/cfl/general'
                                    : '/accountants/companies/general'
                            ],
                            {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            }
                        );
                    } else {
                        this.router.navigate(
                            [
                                !this.userService.appData.userData.accountant
                                    ? '/cfl/packages'
                                    : '/accountants/companies/packages'
                            ],
                            {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            }
                        );
                    }
                }
            } else {
                if (
                    !this.userService.appData.userData.companySelect['METZALEM'] &&
                    urlState.includes('packages')
                ) {
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
            }

            if (
                this.userService.appData.userData.companySelect.budgetPopUpType === 3 &&
                urlState.includes('budget')
            ) {
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

            if (!this.isCustomer && this.userService.appData.userData.companySelect) {
                this.getDataEvent.next(true);
            }

            this.transTypesSub =
                this.transTypesService.selectedCompanyTransTypes.subscribe(
                    (rslt) =>
                        (this.userService.appData.userData.companySelect.companyTransTypes =
                            rslt)
                );
            this.beneficiaryService.companySelectionChange$.next();
            this.transTypesService.companySelectionChange$.next();
            const interMess = setInterval(() => {
                if (this.messagesService._messagesStart) {
                    this.messagesService.companySelectionChange$.next();
                    clearInterval(interMess);
                }
            }, 10);
            this.sharedService.getCurrencyList().subscribe((responseCurr) => {
                this.userService.appData.userData.currencyList = responseCurr ? responseCurr['body'] : responseCurr;
                this.getAccounts();
            });

        }
    }

    getAccounts() {
        this.sharedService
            .getAccounts(this.selectedValue.companyId)
            .pipe(
                tap((response: any) => {
                    this.userService.appData.userData.exampleCompany =
                        response && !response.error && response.body.exampleCompany;
                })
            )
            .subscribe(
                (response: any) => {
                    this.userService.appData.userData.accounts =
                        response && !response.error ? response.body.accounts : null;
                    if (Array.isArray(this.userService.appData.userData.accounts)) {
                        this.userService.appData.userData.accounts.forEach((acc: any) => {
                            if (acc.currency) {
                                const sign = this.userService.appData.userData.currencyList.find(
                                    (curr) => curr.code === acc.currency
                                );
                                if (sign) {
                                    acc.sign = sign.sign;
                                    acc.currencyId = sign.id;
                                } else {
                                    acc.sign = '';
                                    acc.currencyId = 99;
                                }
                            } else {
                                acc.currencyId = 1;
                                acc.sign = 'ש"ח';
                            }
                            acc.isUpToDate = acc.isUpdate;
                            acc.outdatedBecauseNotFound =
                                !acc.isUpToDate &&
                                acc.alertStatus === 'Not found in bank website';
                        });
                        // AccountsByCurrencyGroup.isToday(acc.balanceLastUpdatedDate));
                    }
                    if (this.isCustomer) {
                        this.getDataEvent.next(true);
                    }
                    this.getDataEventGotAcc.next(true);
                    if (
                        this.topNotificationArea &&
                        this.topNotificationArea.companySelectionChange$
                    ) {
                        this.topNotificationArea.companySelectionChange$.next();
                    }
                },
                (err: HttpErrorResponse) => {
                    if (err.error instanceof Error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
    }

    ngAfterViewInit(): void {
        this._changeDetectionRef.detectChanges();
    }

    customerDenyUpgrade(): void {
        this.biziboxTrialExpired.visible = 0;
        this.sharedService
            .customerDenyUpgrade(
                this.userService.appData.userData.companySelect.companyId
            )
            .pipe(
                tap(() => (this.userService.appData.userData.companies = null)),
                switchMap((newCompanyId: any) => {
                    return this.sharedService
                        .getCompanies()
                        .pipe(
                            map((companiesResp) => [newCompanyId, (<any>companiesResp).body])
                        );
                })
            )
            .subscribe({
                next: ([newCompanyId, companies]) => {
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
                        // companyData.deskTrialExpired = true;
                        // //1111
                        companyData.METZALEM_deskTrialExpired =
                            companyData.METZALEM && !companyData.deskTrialExpired;
                    });
                    this.sharedService.announceMissionGetCompanies('newCompanies');
                }
            });
    }

    customerApproveUpgrade(type?: boolean): void {
        if (
            type &&
            this.userService.appData.userData.companySelect.billingAccountId ===
            '00000000-0000-0000-0000-000000000000'
        ) {
            this.trialBlocked.visible = 0;
            this.router.navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/billing'
                        : '/accountants/companies/billing'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            );
        } else {
            this.sharedService
                .customerApproveUpgrade(
                    this.userService.appData.userData.companySelect.companyId
                )
                .pipe(
                    tap(() => (this.userService.appData.userData.companies = null)),
                    switchMap((newCompanyId) => {
                        return this.sharedService
                            .getCompanies()
                            .pipe(
                                map((companiesResp) => [
                                    newCompanyId,
                                    (<any>companiesResp).body
                                ])
                            );
                    })
                )
                .subscribe({
                    next: ([newCompanyId, companies]) => {
                        this.userService.appData.userData.companies = companies;
                        this.userService.appData.userData.companies.forEach(
                            (companyData) => {
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
                                // companyData.deskTrialExpired = true;
                                // //1111
                                companyData.METZALEM_deskTrialExpired =
                                    companyData.METZALEM && !companyData.deskTrialExpired;
                            }
                        );
                        this.sharedService.announceMissionGetCompanies('newCompanies');
                        if (type) {
                            if (
                                this.userService.appData.userData.companySelect
                                    .billingAccountId !== '00000000-0000-0000-0000-000000000000'
                            ) {
                                this.trialBlocked.visible = 2;
                            } else {
                                this.trialBlocked.visible = 0;
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/billing'
                                            : '/accountants/companies/billing'
                                    ],
                                    {
                                        queryParamsHandling: 'preserve'
                                    }
                                );
                            }
                        } else {
                            if (
                                this.userService.appData.userData.companySelect
                                    .billingAccountId !== '00000000-0000-0000-0000-000000000000'
                            ) {
                                this.biziboxTrialExpired.visible = 2;
                            } else {
                                this.biziboxTrialExpired.visible = 0;
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/billing'
                                            : '/accountants/companies/billing'
                                    ],
                                    {
                                        queryParamsHandling: 'preserve'
                                    }
                                );
                            }
                        }
                    }
                });
        }
    }

    onHideOneAccountPopUp(): void {
        this.userService.appData.userData.companySelect.oneAccount = null;
        this.sharedService
            .oneAccountPopUp(
                this.userService.appData.userData.companySelect.companyId
            )
            .subscribe((result) => {
            });
    }

    filterStates(name: string) {
        return this.userService.appData.userData.companies.filter((state) =>
            state.companyName.toLowerCase().includes(name.toLowerCase())
        );
    }

    displayFn(user: any): string {
        return user ? user.companyName : user;
    }

    setStateGroup(index: number) {
        this.step = index;
        if (this.isParent) {
            this.isParent = false;
        }
    }

    setStateGroupChild(index: number, indexParent: number) {
        this.setStateGroup(indexParent);
        this.stepChild = index;
        if (this.isParentChild) {
            this.isParentChild = false;
        }
    }

    openNavWithoutDelay(event): void {
        event.stopImmediatePropagation();
        if (!this.isOpen) {
            this.isOpen = true;
        }
    }

    preventHover(event): void {
        event.preventDefault();
    }

    clearTimeoutDelay(event): void {
        event.stopImmediatePropagation();
        if (this.timeout) {
            this._window.clearTimeout(this.timeout);
        }
    }

    openNavWithDelay(event): void {
        event.stopImmediatePropagation();
        if (this.timeout) {
            this._window.clearTimeout(this.timeout);
        }
        if (!this.isOpen) {
            this.timeout = this._window.setTimeout(() => {
                this._window.clearTimeout(this.timeout);
                if (!this.isHover && !this.isOpen) {
                    this.isHover = true;
                }
                if (!this.isHoverChild && !this.isOpen) {
                    this.isHoverChild = true;
                }
            }, 1000);
        }
    }

    mouseleaveSideNav(event): void {
        event.stopImmediatePropagation();
        if (this.timeout) {
            this._window.clearTimeout(this.timeout);
        }
        if (this.isHover && !this.isOpen) {
            this.timeout = this._window.setTimeout(() => {
                this._window.clearTimeout(this.timeout);
                this.step = 99;
                this.isHover = false;
                this.stepChild = 99;
                this.isHoverChild = false;
            }, 200);
        }
    }

    openedClick(): void {
        console.log('openedClick');
    }

    closedClick(): void {
        console.log('closedClick');
    }

    toggleFullscreen(): void {
        const elem = this._element.nativeElement.querySelector('.container');
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullScreen) {
            elem.msRequestFullScreen();
        }
    }

    ngOnDestroy() {
        this.subscriptionCompanies.unsubscribe();

        if (this.getDataEvent) {
            this.getDataEvent.next(true);
            this.getDataEvent.unsubscribe();
        }
        if (this.getDataEventGotAcc) {
            this.getDataEventGotAcc.next(true);
            this.getDataEventGotAcc.unsubscribe();
        }
        if (this.getCompaniesEvent) {
            this.getCompaniesEvent.next(true);
            this.getCompaniesEvent.unsubscribe();
        }
        if (this.reloadEvent) {
            this.reloadEvent.next(true);
            this.reloadEvent.unsubscribe();
        }
        if (this.transTypesSub) {
            this.transTypesSub.unsubscribe();
        }

        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
    }

    sendUserComment() {
        const screenName = this.router.url.split('?', 1)[0].replace('cfl/', '');

        this.userCommentPrompt.processing = true;
        this.sharedService
            .userTicketCreate({
                body: this.userCommentPrompt.form.get('userMessage').value,
                companyName:
                this.userService.appData.userData.companySelect.companyName,
                screenName: screenName
            })
            .subscribe(() => {
                this.userCommentPrompt.processing = false;
            });
    }

    userCommentPromptVisible(visible: boolean) {
        this.userCommentPrompt.visible = false;
        this.userCommentPrompt.processing = null;
        this.userCommentPrompt.form.reset();
    }

    sendActivationMails() {
        this.sharedService
            .sendActivationMails()
            .pipe(take(1))
            .subscribe((resp) => {
                this.openPopReplaceMail(resp.body);
            });
    }

    openPopReplaceMail(mail: string = '') {
        this.hideMail = true;
        this.formMail = this.fb.group({
            form: this.fb.group({
                mail: new FormControl('', {
                    validators: [Validators.required, Validators.email],
                    updateOn: 'change'
                })
            })
        });
        this.popUpReplaceMailShow = {
            styleClass: 'popUpReplaceMailShow',
            height: 418,
            width: 428,
            step: 0,
            footer: true,
            valid: true,
            currentMailAddress: mail
        };
    }

    handleFocusUsername() {
        this.formMail.get('form')['controls'].mail.markAsUntouched();
    }

    nextStepMail(model: any) {
        if (this.popUpReplaceMailShow.step === 0) {
            this.popUpReplaceMailShow.step += 1;
            this.formMail = this.fb.group({
                form: this.fb.group({
                    mail: new FormControl(
                        this.formMail.get('form')['controls'].mail.value,
                        {
                            validators: [Validators.required, Validators.email],
                            updateOn: 'blur'
                        }
                    ),
                    password: ['', <any>Validators.required]
                })
            });
        } else {
            const {mail, password} = model.form;
            this.sharedService
                .updateUserMail({
                    mail: mail,
                    password: password
                })
                .subscribe(
                    (response: any) => {
                        this.popUpReplaceMailShow.step += 1;
                    },
                    (err: HttpErrorResponse) => {
                        this.formMail.get('form').setErrors({incorrectPass: true});
                        if (err.error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
        }
    }

    checkMailExists(): void {
        if (!this.formMail.get('form')['controls'].mail.invalid) {
            this.sharedService
                .checkMailExists(this.formMail.get('form')['controls'].mail.value)
                .subscribe(
                    (response: any) => {
                        const isExist = response ? response['body'] : response;
                        this.formMail.get('form').setErrors({incorrect: isExist});
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
        }
    }

    onKnowledgeBaseIntroductionHide() {
        this.knowledgeBaseIntroduction.visible = false;
        this.storageService.localStorageSetter(
            this.userService.appData.userData.userName + '_knowledgeBaseIntroduction',
            JSON.stringify(this.knowledgeBaseIntroduction)
        );
    }

    onbiziboxTrialExpiredHide() {
        this.biziboxTrialExpired.visible = 0;
    }

    ontrialBlockedHide() {
        this.trialBlocked.visible = 0;
    }

    showOpenTicket(
        getData?: boolean,
        companyIDSet?: string,
        nickname?: string,
        isBank?: any
    ) {
        if (companyIDSet) {
            this.nickname = nickname;
            this.companyId = companyIDSet;
            this.isBank = !!isBank;
        } else {
            this.nickname = false;
            this.companyId = false;
            this.isBank = true;
        }
        if (getData) {
            this.sharedService.getUserSettings().subscribe(
                (response: any) => {
                    this.knowledgeBaseVisible = response ? response['body'] : response;

                    // {
                    //     "activated": true,
                    //     "activatorDateCreated": "2018-07-03T00:00:00",
                    //     "authenticationType": "REGULAR",
                    //     "cellPhone": "string",
                    //     "firstName": "string",
                    //     "language": "string",
                    //     "lastName": "string",
                    //     "mail": "string"
                    // }
                },
                (err: HttpErrorResponse) => {
                    if (err.error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
        } else {
            this.knowledgeBaseVisible = true;
        }
        // this.helpCenterService.activeTab.next(this.helpCenterService.tabs.find(tab => tab.id === 'serviceCall'));
    }

    selectedCompanyPopupAlertStorageKey(): string {
        return [
            this.userService.appData.userData.companySelect.companyId,
            'popupAlertShownAt',
            'ttl'
        ].join('_');
    }

    showOpenCompaniesPopUp() {
        this.showAddCompaniesPopUp = true;
    }

    public tryToShowTaryaPopup() {
        const taryaPrompt = {
            companiesSelectable: this.userService.appData.userData.companies.filter(
                (cmpny) =>
                    Array.isArray(cmpny.privs) &&
                    ['COMPANYSUPERADMIN', 'COMPANYADMIN'].some((admPriv) =>
                        cmpny.privs.includes(admPriv)
                    )
            )
        };

        if (taryaPrompt.companiesSelectable.length) {
            this.userService.appData.userData.taryaPopupPrompt = taryaPrompt;
        }
    }

    public showLoanDetailsPopupWith(param: {
        loanId: string;
        companyAccountId: string;
    }) {
        this.viewContainerRef.clear();
        // 1. Create a component reference from the component
        const componentRef = this.viewContainerRef.createComponent(
            LoanDetailsPromptComponent,
            {injector: this.injector}
        );
        if (!componentRef) {
            return;
        }
        // LoanDetailsOverlayPromptComponent
        componentRef.instance.dynamicalyApply(
            [param.companyAccountId],
            param.loanId
        );

        // 2. Attach component to the appRef so that it's inside the ng component tree
        this.appRef.attachView(componentRef.hostView);

        // 3. Get DOM element from component
        const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
            .rootNodes[0] as HTMLElement;
        // 4. Append DOM element to the body
        document.body.appendChild(domElem);
        // const instanceCom = (<LoanDetailsPromptComponent>componentRef.instance);
        setTimeout(() => {
            componentRef.instance.hideLoan.subscribe(() => {
                // console.log('----> this.componentRef.instance.close.subscribe: %o', val);
                if (componentRef) {
                    if (componentRef.hostView) {
                        this.appRef.detachView(componentRef.hostView);
                    }
                    componentRef.destroy();
                }
            });
        }, 0);
    }

    customerApproveDowngrade(): void {
        this.biziboxDowngradeDate.visible = 0;
        this.sharedService
            .customerApproveDowngrade(
                this.userService.appData.userData.companySelect.companyId
            )
            .subscribe((result) => {
            });
    }

    sendWizardMailHide(): void {
        this.userService.appData.sendWizardMail = null;
    }

    sendWizardMail() {
        if (
            this.userService.appData.sendWizardMail.length &&
            this.userService.appData.sendWizardMail.filter((id) => id !== null)
                .length &&
            this.userService.appData.sendWizardMailCheck
        ) {
            this.sharedService
                .sendWizardMail(
                    this.userService.appData.sendWizardMail.filter((id) => id !== null)
                )
                .subscribe((result) => {
                    this.userService.appData.sendWizardMail = null;
                });
        } else {
            this.userService.appData.sendWizardMail = null;
        }
    }

    modalUpdateSystemHide() {
        this.storageService.localStorageSetter(
            'hideModalUpdateSystem',
            String(true)
        );
        this.showModalUpdateSystem = false;
    }

    modalUpdatesListHide() {
        this.storageService.localStorageSetter(
            'updatesList_' + this.userService.appData.userData.userName,
            JSON.stringify(this.userService.appData.updatesList.data)
        );
        this.userService.appData.updatesList = false;
    }

    budgetPopUp(goTo?: any, e?: any): void {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.sharedService
            .budgetPopUp({
                companyId: this.userService.appData.userData.companySelect.companyId,
                budgetPopUpType:
                this.userService.appData.userData.companySelect.budgetPopUpType,
                purchase:
                    this.budgetPopUpType.visible === 3 ||
                    this.budgetPopUpType.visible === 5
            })
            .subscribe(() => {
                if (goTo === undefined && this.budgetPopUpType.visible !== 3) {
                    this.budgetPopUpType.visible = 0;
                    this.router.navigate(
                        [
                            !this.userService.appData.userData.accountant
                                ? '/cfl/budget'
                                : '/accountants/companies/budget'
                        ],
                        {
                            queryParamsHandling: 'preserve'
                        }
                    );
                } else if (
                    this.budgetPopUpType.visible === 3 ||
                    this.budgetPopUpType.visible === 5
                ) {
                    this.budgetPopUpType.visible = 4;
                }
            });
    }

    budgetPopUpTypeHide(): void {
        if (this.budgetPopUpType.visible === 2) {
            const isSaveNumClose =
                this.storageService.localStorageGetterItem('closeSlideBudget');
            if (isSaveNumClose) {
                this.storageService.localStorageSetter(
                    'closeSlideBudget',
                    (Number(isSaveNumClose) + 1).toString()
                );
                if (Number(isSaveNumClose) + 1 >= 3) {
                    this.budgetPopUp(false);
                }
            } else {
                this.storageService.localStorageSetter('closeSlideBudget', '1');
            }
        }
        if (this.budgetPopUpType.visible === 1) {
            this.budgetPopUp(false);
        }
        this.budgetPopUpType.visible = 0;
    }

    clickOnTitle(): void {
        if (this.budgetPopUpType.visible === 5) {
            this.budgetPopUp();
        }
    }

    onReload() {
        this.reloadEvent.next(true);
        this.mixScreenName('refresh button');
        // if (!this.router.url.includes('cfl') && !this.isCustomer) {
        //     this.reloadEvent.next(true);
        // } else {
        //     // this.selectCompany();
        // }
    }

    clickOnContent(): void {
        if (this.budgetPopUpType.visible === 5) {
            if (
                this.userService.appData.userData.companySelect.budgetExpiredDays > 0
            ) {
                this.budgetPopUpType.visible = 0;
                this.router.navigate(
                    [
                        !this.userService.appData.userData.accountant
                            ? '/cfl/budget'
                            : '/accountants/companies/budget'
                    ],
                    {
                        queryParamsHandling: 'preserve'
                    }
                );
            } else if (
                this.userService.appData.userData.companySelect.budgetExpiredDays === 0
            ) {
                this.budgetPopUp();
            }
        }
    }

    onAddCompanyDialogVisibilityChange(addCompanyFormContainer: AddCompanyDialogComponent) {
        this.showAddCompaniesPopUp = false;
        addCompanyFormContainer.addCompanyForm.reset();
    }
}
