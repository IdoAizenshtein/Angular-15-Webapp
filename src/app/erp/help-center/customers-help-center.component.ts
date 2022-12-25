import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UserService} from '@app/core/user.service';
import {QuestionData, Searchable, TermData, VideoData} from './searchable.model';
import {Observable, Subject} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
// import {Searchable, TermData} from '@app/shared/component/knowledge-base/help-center.service';
import {MatLegacyOptionSelectionChange as MatOptionSelectionChange} from '@angular/material/legacy-core';
import {FilterSearchablesPipe} from './filter-searchables.pipe';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {ErpService} from '../erp.service';
import {StorageService} from '@app/shared/services/storage.service';

@Component({
    selector: 'app-customers-help-center',
    templateUrl: './customers-help-center.component.html',
    encapsulation: ViewEncapsulation.None
})
export class CustomersHelpCenterComponent implements OnInit, OnDestroy {
    public navScreen: any = 2;

    readonly searchFC = new FormControl('');
    public queryString: string = '';
    readonly sectionsList: any = [
        // {
        //     title: 'הקמת תחנה חדשה',
        //     stage: 1
        // },
        {
            title: 'הוספת כ.אשראי חוץ בנקאי',
            stage: 2
        },
        {
            title: 'קישור כרטיס הנה”ח לח.בנק',
            stage: 3
        },
        {
            title: 'הוספת חשבון בנק',
            stage: 4
        },
        {
            title: 'אפליקציה לפועלים בעסקים',
            stage: 5
        },
        {
            title: 'מייל יומי',
            stage: 6
        },
        {
            title: 'ניתוק ח.בנק/ כ. אשראי',
            stage: 7
        },
        {
            title: 'קישור כרטיס הנה”ח לאשראי',
            stage: 8
        },
        {
            title: 'עדכון פרטי כניסה',
            stage: 10
        },
        {
            title: 'טעינת פועלים לעסקים',
            stage: 11
        },
        {
            title: 'מחיקת ח.בנק/ כ.אשראי',
            stage: 12
        },
        {
            title: 'אודות bizibox',
            stage: 9
        }
    ];
    filteredData = [];

    readonly faqList$: Observable<Array<QuestionData>>;
    readonly responsesParsed: { [k: string]: SafeHtml } = {};

    readonly termsList$: Observable<Array<TermData>>;

    private searchExpression$: Observable<string>; // Observable<Array<string>>;

    readonly selectedCompanyTypeChange: Observable<string>;
    readonly videosList$: Observable<Array<VideoData>>;
    knowledgeBaseVisible: any = false;

    private readonly destroyed$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    constructor(
        public userService: UserService,
        private erpService: ErpService,
        private storageService: StorageService,
        private route: ActivatedRoute,
        private router: Router,
        private _sanitizer: DomSanitizer,
        private filterSearchablesPipe: FilterSearchablesPipe,
        private activatedRoute: ActivatedRoute
    ) {
        // this.sectionsList = Object.values(this.userService.appData.userData.accountant ? AccountantSectionModel : SectionModel)
        //     .filter(k => isNaN(k));
        // this.selectedCompanyTypeChange = this.userService.appData.userData.accountant ? of(true)
        //     : this.sharedComponent.getDataEvent
        //         .pipe(
        //             startWith(true),
        //             filter(() => this.userService.appData
        //                 && this.userService.appData.userData
        //                 && this.userService.appData.userData.companySelect
        //                 && this.userService.appData.userData.companySelect.biziboxType),
        //             map(() => this.userService.appData.userData.companySelect.biziboxType),
        //             distinctUntilChanged()
        //         );
        //
        // this.faqList$ = this.selectedCompanyTypeChange
        //     .pipe(
        //         switchMap(() => this.helpCenterService.requestFAQList()),
        //         map((response:any) => !response.error ? response.body : null),
        //         tap((questions) => {
        //             if (Array.isArray(questions)) {
        //                 questions.forEach((question: QuestionData, idx) => {
        //                     question.questionId = String(idx);
        //                 });
        //             }
        //         }),
        //         shareReplay(1),
        //         // publishReplay(1),
        //         // refCount(),
        //         takeUntil(this.destroyed$)
        //     );
        //
        // this.termsList$ = this.selectedCompanyTypeChange
        //     .pipe(
        //         switchMap(() => this.helpCenterService.requestTermList()),
        //         map((response:any) => !response.error ? response.body : null),
        //         shareReplay(1),
        //         // publishReplay(1),
        //         // refCount(),
        //         takeUntil(this.destroyed$)
        //     );
        //

        this.searchFC.valueChanges
            .pipe(
                debounceTime(1000),
                takeUntil(this.destroyed$),
                distinctUntilChanged()
            )
            .subscribe((term) => {
                this.queryString = term;
                if (this.queryString !== null) {
                    if (this.queryString.length) {
                        this.filteredData = this.sectionsList.filter((vstr) =>
                            vstr.title.toString().includes(this.queryString)
                        );
                    } else {
                        this.filteredData = this.sectionsList;
                    }
                } else {
                    this.filteredData = this.sectionsList;
                }
            });

        //
        // this.videosList$ = this.selectedCompanyTypeChange
        //     .pipe(
        //         switchMap(() => this.helpCenterService.requestVideoList()),
        //         map((response:any) => !response.error ? response.body : null),
        //         tap(response => {
        //             if (Array.isArray(response)) {
        //                 response
        //                     .forEach(item => {
        //                         item.vimeoData = this.helpCenterService.requestVimeoData(item.url);
        //                     });
        //             }
        //         }),
        //         shareReplay(1),
        //         // publishReplay(1),
        //         // refCount(),
        //         takeUntil(this.destroyed$)
        //     );
    }

    ngOnInit() {
        this.filteredData = [...this.sectionsList];
    }

    // noinspection JSMethodCanBeStatic
    private toRegExp(text: string): RegExp {
        if (!text) {
            return null;
        }
        return new RegExp(text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    }

    // private splitToWords(val: string): Array<string> {
    //     return !val ? [] : val.split(' ').map(part => part.trim()).filter(part => part);
    // }
    //
    // private filterList<T extends Searchable>(list: Array<T>, wordsToSearch: Array<string>): Array<T> {
    //     if (!Array.isArray(list)) {
    //         return [];
    //     }
    //
    //     if (!Array.isArray(wordsToSearch) || !wordsToSearch.length) {
    //         return list;
    //     }
    //
    //     const filtered = list.filter((faq) => {
    //         return faq.keywords.some(kw => {
    //             return wordsToSearch.some(wrd => kw.keyword.includes(wrd));
    //         });
    //     });
    //
    //     return filtered;
    // }

    handleQuestionClick(faq: QuestionData, evt: Event) {
        if (
            !(faq.question in this.responsesParsed) &&
            faq.linkText &&
            faq.linkAction
        ) {
            const regex = this.toRegExp(faq.linkText);
            // this.responsesParsed[faq.question] = this._sanitizer.bypassSecurityTrustHtml(
            //     msg.messageTemplate.replace(regex,
            //         '<button class="button-link linked_text">'
            //         + msg.linked_text + '</button>'));
            this.responsesParsed[faq.question] =
                this._sanitizer.bypassSecurityTrustHtml(
                    faq.answer.replace(
                        regex,
                        '<button class="button-link linked_text">' +
                        faq.linkText +
                        '</button>'
                    )
                );
        }

        if (
            evt.target instanceof HTMLElement &&
            (evt.target as HTMLElement).classList.contains('linked_text')
        ) {
            this.handleQuestionActionClick(faq, faq.linkAction);
            evt.stopPropagation();
        } else {
            (faq as any).expanded = !(faq as any).expanded;
        }
    }

    handleQuestionActionClick(faq: QuestionData, action: string) {
        console.log('handleQuestionActionClick ==> %o with %o', action, faq);

        const goActionMatch = /go:(.+)/g.exec(action);
        if (goActionMatch !== null) {
            this.router
                .navigate(
                    [
                        `/${this.userService.appData.userData.pathMainApp}/${goActionMatch[1]}`
                    ],
                    {
                        queryParamsHandling: 'preserve'
                    }
                )
                .then(() => {
                    // if (this.dialog) {
                    //     requestAnimationFrame(() => this.dialog.visible = false);
                    // }
                });
        }

        const openActionMatch = /open:(.+)/g.exec(action);
        if (openActionMatch !== null) {
            // if (openActionMatch[1] === 'payment recommendation' && this.sharedComponent) {
            //     // if (this.dialog) {
            //     //     requestAnimationFrame(() => this.dialog.visible = false);
            //     // }
            //     this.sharedComponent.recommendationCalculatorShow = true;
            // }
        }
    }

    // displayFn(option?: TermData | QuestionData): string | undefined {
    //     if (!option) {
    //         return undefined;
    //     }
    //     if (option instanceof TermData || ((<any>option).subject)) {
    //         return (option as TermData).subject;
    //     } else if (option instanceof QuestionData || (<any>option).question) {
    //         return (option as QuestionData).question;
    //     }
    //     return undefined;
    // }

    // hintSelected($event: MatAutocompleteSelectedEvent) {
    //     // debugger;
    //     // this.searchFC.setValue(this.displayFn($event.option.value), {emitEvent: false});
    //     // $event.option
    // }

    optionSelected<T extends Searchable>(
        $event: MatOptionSelectionChange,
        searchable: T
    ) {
        if (
            $event.source.selected &&
            Array.isArray(searchable.screens) &&
            searchable.screens.length
        ) {
            this.router
                .navigate([searchable.screens[0].screenName], {
                    relativeTo: this.activatedRoute,
                    queryParamsHandling: 'preserve'
                })
                .then((result) => {
                    if (result) {
                        // this.helpCenterService.navigateSearchable$.next(searchable);
                    }
                });

            // if (searchable instanceof TermData || ((<any>searchable).subject)) {
            //     textToSearch = (<any>searchable).subject;
            // } else if (searchable instanceof QuestionData || (<any>searchable).question) {
            //     textToSearch = (<any>searchable).question;
            // }
        }
    }

    showOpenTicket() {
        if (
            !this.userService.appData.accFromBank ||
            !this.userService.appData.token
        ) {
            if (this.userService.appData && this.userService.appData.station_id) {
                this.erpService
                    .trustStatus({
                        stationId: this.userService.appData.station_id,
                        trustId: this.storageService.localStorageGetterItem('trustId')
                            ? this.storageService.localStorageGetterItem('trustId')
                            : null
                    })
                    .subscribe((response: any) => {
                        this.userService.appData.trustStatus = response
                            ? response['body']
                            : response;
                        this.userService.appData.token =
                            this.userService.appData.trustStatus.token;
                        this.erpService
                            .getAccountsForStation({
                                uuid: this.userService.appData.station_id
                            })
                            .subscribe((responseData) => {
                                const accountsForStation = responseData
                                    ? responseData['body']
                                    : responseData;

                                if (accountsForStation.accountsByStationData) {
                                    this.userService.appData.accFromBank = [];
                                    JSON.parse(
                                        JSON.stringify(accountsForStation.accountsByStationData)
                                    ).forEach((it) => {
                                        it.accountDetails.forEach((accChild) => {
                                            this.userService.appData.accFromBank.push({
                                                accountNickname: accChild.accountNickname
                                            });
                                        });
                                    });
                                    this.userService.appData.companiesFromBank =
                                        accountsForStation.accountsByStationData.map((it) => {
                                            return {
                                                companyName: it.companyName
                                            };
                                        });
                                } else {
                                    this.userService.appData.companiesFromBank = [];
                                    this.userService.appData.accFromBank = [];
                                }

                                this.knowledgeBaseVisible = true;
                            });
                    });
            }
        } else {
            this.knowledgeBaseVisible = true;
        }
    }
}
