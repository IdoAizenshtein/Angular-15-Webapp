/* tslint:disable:max-line-length */
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../../core/user.service';
import {slideInOut} from '../../animations/slideInOut';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute} from '@angular/router';
import {BrowserService} from '@app/shared/services/browser.service';
import {filter, startWith, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs/internal/Subscription';
import {
    CustomersFinancialManagementSlikaComponent
} from '../../../customers/financialManagement/slika/customers-financialManagement-slika.component';

@Component({
    selector: 'app-solek-select',
    templateUrl: './solek-select.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class SolekSelectComponent implements OnInit, OnDestroy, AfterViewInit {
    public showPanelDD = false;
    public parentNode: ElementRef;
    public checkAll = true;
    public textSoleks: string;
    readonly storageKey: string;

    @Input()
    set solek(solek: any) {
        if (solek) {
            // const detailsFilterAcc = this.storageService.sessionStorageGetterItem(this.route.routeConfig.path + '-filterAcc');
            // const detailsFilterAccParse = detailsFilterAcc ? JSON.parse(detailsFilterAcc) : [];
            // this.changed.emit(false);
        }
    }

    @Output() changed = new EventEmitter<boolean>();

    solkimListArrivedSub: Subscription;

    static storageKey(route: ActivatedRoute, replaceLastWith?: string): string {
        const pathToRoot = route.pathFromRoot
            .filter((actRoute) => actRoute.snapshot.url.length)
            .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), []);

        // if (replaceLastWith) {
        //     pathToRoot.splice(-1, 1, replaceLastWith);
        // }
        // return pathToRoot.slice(-2).join('/') + '-filterSolkim';

        return [pathToRoot.slice(-2, -1), '*-filterSolkim'].join('/');
    }

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        private _element: ElementRef,
        private storageService: StorageService,
        private route: ActivatedRoute,
        private slikaComponent: CustomersFinancialManagementSlikaComponent
    ) {
        this.storageKey = SolekSelectComponent.storageKey(this.route);
        // this.readFromStorage();

        // interval(10)
        //     .pipe(
        //         takeUntil(timer(20000)),
        //         takeWhile(() => (!this.userService.appData || !this.userService.appData.userData
        //             || !this.userService.appData.userData.slika)),
        //         tap(null, null, () => {
        //             // debugger;
        //             if (this.userService.appData && this.userService.appData.userData && this.userService.appData.userData.slika) {
        //                 if (!this.readFromStorage()) {
        //                     this.applyDefaults();
        //                 }
        //                 this.checkHowManyChecked();
        //             }
        //         })
        //     )
        //     .subscribe(() => console.log('Waiting for solkim....'));
    }

    private applyDefaults() {
        this.userService.appData.userData.slika.forEach((slkAcc) => {
            slkAcc.children.forEach((slk) => (slk.check = true));
            slkAcc.check = slkAcc.children.every((slk) => slk.check);
        });

        this.checkAll = this.userService.appData.userData.slika.every(
            (slkAcc) => slkAcc.check
        );
        this.checkHowManyChecked();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside($event: any) {
        // console.log('%o, -- %o', $event, this.parentNode);
        const elementRefInPath = BrowserService.pathFrom($event).find(
            (node) => node === this._element.nativeElement
        );
        if (!elementRefInPath) {
            if (this.showPanelDD) {
                this.showPanelDD = false;
            }
        }
    }

    ngAfterViewInit(): void {
        this.parentNode = this._element.nativeElement;
    }

    ngOnInit(): void {
        this.solkimListArrivedSub = this.slikaComponent.getDataSolekEvent
            .pipe(
                startWith(true),
                filter(() => Array.isArray(this.userService.appData.userData.slika)),
                tap(() => {
                    if (!this.readFromStorage()) {
                        this.applyDefaults();
                    }
                    this.checkHowManyChecked();
                })
            )
            .subscribe(() => {
            });
    }

    changeAll() {
        this.userService.appData.userData.slika.forEach((solek, idx, arr) => {
            arr[idx].check = this.checkAll;
            solek.children.forEach((card, idx1, arr1) => {
                arr1[idx1].check = this.checkAll;
            });
        });
        this.checkHowManyChecked();
    }

    changeSelectionAt(solek?: any, mainParent?: any) {
        if (solek.children) {
            solek.children.forEach((c, idx, arr) => {
                arr[idx].check = solek.check;
            });
            if (solek.check) {
                let allCheck = true;
                this.userService.appData.userData.slika.forEach((soleks, idx, arr) => {
                    const lenCheckAll = soleks.children.filter((c) => c.check);
                    if (lenCheckAll.length !== soleks.children.length) {
                        allCheck = false;
                    }
                });
                this.checkAll = allCheck;
            } else {
                this.checkAll = false;
            }
        } else {
            const lenCheck = mainParent.children.filter((c) => c.check);
            if (lenCheck.length !== mainParent.children.length) {
                mainParent.check = false;
                this.checkAll = false;
            } else {
                mainParent.check = true;
                let allCheck = true;
                this.userService.appData.userData.slika.forEach((soleks, idx, arr) => {
                    const lenCheckAll = soleks.children.filter((c) => c.check);
                    if (lenCheckAll.length !== soleks.children.length) {
                        allCheck = false;
                    }
                });
                this.checkAll = allCheck;
            }
        }
        this.checkHowManyChecked();
    }

    checkHowManyChecked() {
        if (!this.checkAll) {
            let numCheck = 0,
                solekBankId = '';
            this.userService.appData.userData.slika.forEach((soleks, idx, arr) => {
                const lenCheckAll = soleks.children.filter((c) => c.check);
                if (lenCheckAll.length) {
                    solekBankId =
                        lenCheckAll[0].solekDesc ||
                        `${
                            this.translate.translations[this.translate.currentLang]
                                .clearingAgencies[lenCheckAll[0].solekBankId]
                        }
                - ${lenCheckAll[0].solekNum}`;
                }
                numCheck += lenCheckAll.length;
            });
            if (numCheck === 0) {
                this.textSoleks =
                    this.translate.translations[
                        this.translate.currentLang
                        ].actions.clearingAgency;
            } else if (numCheck === 1) {
                this.textSoleks = solekBankId;
            } else {
                this.textSoleks =
                    this.translate.translations[
                        this.translate.currentLang
                        ].filters.multiSelection;
            }
        }
        // this.storageService.sessionStorageClear('sortableIdGrSolek');
        this.changed.emit(true);
        this.writeToStorage();
    }

    // private storeSelection(): void {
    //   this.storageService.sessionStorageClear('sortableIdGr');
    //   this.storageService.sessionStorageClear(this.route.routeConfig.path + '-');
    //   this.storageService.sessionStorageSetter(this.route.routeConfig.path + '-filterAcc',
    //     JSON.stringify(this.userService.appData.userData.accountSelect.map((id) => id.companyAccountId)));
    // }

    ngOnDestroy(): void {
        if (this.solkimListArrivedSub) {
            this.solkimListArrivedSub.unsubscribe();
        }
    }

    private readFromStorage(): boolean {
        try {
            const storedParsed = JSON.parse(
                this.storageService.sessionStorageGetterItem(this.storageKey)
            );
            if (storedParsed instanceof Array) {
                this.userService.appData.userData.slika.forEach((slkAcc) => {
                    // debugger;
                    if (storedParsed.includes(slkAcc.companyAccountId)) {
                        slkAcc.children.forEach((slk) => {
                            slk.check = true;
                        });
                        slkAcc.check = true;
                    } else {
                        slkAcc.children.forEach((slk) => {
                            slk.check = storedParsed.includes(
                                slk.companyAccountId + slk.solekNum
                            );
                        });
                        slkAcc.check = slkAcc.children.every((slk) => slk.check);
                    }
                });

                this.checkAll = this.userService.appData.userData.slika.every(
                    (slkAcc) => slkAcc.check
                );

                return this.userService.appData.userData.slika.some((slkAcc) => {
                    return slkAcc.children.some((slk) => slk.check);
                });
                // return true;
            }
        } catch (e) {
            console.error('Failed to apply session storage value.', e);
        }
        return false;
    }

    private writeToStorage(): void {
        this.storageService.sessionStorageSetter(
            this.storageKey,
            JSON.stringify(
                this.userService
                    .selectedSolkim()
                    .map((slk) => slk.companyAccountId + slk.solekNum)
            )
        );
    }

    applySelection(solekNums: any[]) {
        const currSelection = this.userService.selectedSolkim();

        if (
            currSelection.length !== solekNums.length ||
            currSelection.some(
                (slk) =>
                    solekNums.findIndex(
                        (slkSelection) =>
                            slkSelection.companyAccountId === slk.companyAccountId &&
                            slkSelection.solekNum === slk.solekNum
                    ) < 0
            )
        ) {
            this.userService.appData.userData.slika.forEach((slkAcc) => {
                slkAcc.children.forEach(
                    (slk) =>
                        (slk.check =
                            solekNums.findIndex(
                                (slkSelection) =>
                                    slkSelection.companyAccountId === slk.companyAccountId &&
                                    slkSelection.solekNum === slk.solekNum
                            ) >= 0)
                );
                slkAcc.check = slkAcc.children.every((slk) => slk.check);
            });

            this.checkAll = this.userService.appData.userData.slika.every(
                (slkAcc) => slkAcc.check
            );

            this.checkHowManyChecked();
        }
    }
}
