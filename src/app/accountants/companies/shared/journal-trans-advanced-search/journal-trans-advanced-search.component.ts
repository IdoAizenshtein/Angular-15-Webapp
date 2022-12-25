import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {SharedComponent} from '@app/shared/component/shared.component';
import {OcrService} from '../ocr.service';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service';

@Component({
    selector: 'app-journal-trans-advanced-search',
    templateUrl: './journal-trans-advanced-search.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class JournalTransAdvancedSearchComponent implements OnDestroy, OnInit {
    showPanelDD = false;
    @Output() selectedParamsForSearch: EventEmitter<any> = new EventEmitter();
    @Input() title: string;
    @Input() advancedSearchParams: any;
    // @ViewChild('transDateSelector', {read: Calendar}) transDateSelector: Calendar;
    // @ViewChild('transDateSelector2', {read: Calendar}) transDateSelector2: Calendar;
    @Input() isCredit: boolean = false;
    companyCustomerDetails$: Observable<any>;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public route: ActivatedRoute,
        public translate: TranslateService,
        public sharedComponent: SharedComponent,
        private ocrService: OcrService,
        private sharedService: SharedService,
        protected storageService: StorageService,
        public userService: UserService
    ) {
    }

    ngOnInit(): void {
        this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                map(() =>
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect
                        ? this.userService.appData.userData.companySelect.companyId
                        : null
                ),
                filter((companyId) => !!companyId),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
                this.sharedService
                    .companyGetCustomer({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        sourceProgramId:
                        this.userService.appData.userData.companySelect.sourceProgramId
                    })
                    .subscribe((resp) => {
                    });
            });
    }

    scrollTillSelectable() {
        // const startOfMinMonth = new Date(this.transDateSelector.minDate.getFullYear(), this.transDateSelector.minDate.getMonth(), 1);
        // while (new Date(this.transDateSelector.currentYear, this.transDateSelector.currentMonth, 1) < startOfMinMonth) {
        //     this.transDateSelector.navForward(document.createEvent('Event'));
        // }
    }

    scrollTillSelectable2() {
        // const startOfMinMonth = new Date(this.transDateSelector2.minDate.getFullYear(), this.transDateSelector2.minDate.getMonth(), 1);
        // while (new Date(this.transDateSelector2.currentYear, this.transDateSelector2.currentMonth, 1) < startOfMinMonth) {
        //     this.transDateSelector2.navForward(document.createEvent('Event'));
        // }
    }

    public changeDatesFrequencyDesc(type: string): void {
        if (type === 'sendDateFrom' || type === 'sendDateTill') {
            const dateFrom = this.advancedSearchParams
                .get('sendDateFrom')
                .value.getTime();
            const dateTill = this.advancedSearchParams
                .get('sendDateTill')
                .value.getTime();
            if (type === 'sendDateFrom') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('sendDateTill')
                        .setValue(this.advancedSearchParams.get('sendDateFrom').value);
                }
            } else if (type === 'sendDateTill') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('sendDateFrom')
                        .setValue(this.advancedSearchParams.get('sendDateTill').value);
                }
            }
        } else if (type === 'invoiceDateFrom' || type === 'invoiceDateTill') {
            const dateFrom = this.advancedSearchParams
                .get('invoiceDateFrom')
                .value.getTime();
            const dateTill = this.advancedSearchParams
                .get('invoiceDateTill')
                .value.getTime();
            if (type === 'invoiceDateFrom') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('invoiceDateTill')
                        .setValue(this.advancedSearchParams.get('invoiceDateFrom').value);
                }
            } else if (type === 'invoiceDateTill') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('invoiceDateFrom')
                        .setValue(this.advancedSearchParams.get('invoiceDateTill').value);
                }
            }
        }
    }

    togglePanel() {
        // if (!this.showPanelDD) {
        //
        // }
        this.showPanelDD = !this.showPanelDD;
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    search() {
        if (!this.isCredit) {
            if (
                (!this.advancedSearchParams.get('totalFrom').value &&
                    this.advancedSearchParams.get('totalTill').value) ||
                (this.advancedSearchParams.get('totalFrom').value &&
                    !this.advancedSearchParams.get('totalTill').value) ||
                (this.advancedSearchParams.get('doseNumber').value &&
                    this.advancedSearchParams.get('doseNumber').errors) ||
                (this.advancedSearchParams.get('orderNumber').value &&
                    this.advancedSearchParams.get('orderNumber').errors) ||
                (!this.advancedSearchParams.get('custFrom').value &&
                    this.advancedSearchParams.get('custTill').value) ||
                (this.advancedSearchParams.get('custFrom').value &&
                    !this.advancedSearchParams.get('custTill').value)
            ) {
                return true;
            }
            this.togglePanel();
            console.log(this.advancedSearchParams);
            this.selectedParamsForSearch.emit(this.advancedSearchParams);
            return false;
        } else {
            if (
                (this.advancedSearchParams.get('sendDateFrom').value &&
                    !this.advancedSearchParams.get('sendDateTill').value) ||
                (!this.advancedSearchParams.get('sendDateFrom').value &&
                    this.advancedSearchParams.get('sendDateTill').value) ||
                (this.advancedSearchParams.get('invoiceDateFrom').value &&
                    !this.advancedSearchParams.get('invoiceDateTill').value) ||
                (!this.advancedSearchParams.get('invoiceDateFrom').value &&
                    this.advancedSearchParams.get('invoiceDateTill').value) ||
                (!this.advancedSearchParams.get('totalFrom').value &&
                    this.advancedSearchParams.get('totalTill').value) ||
                (this.advancedSearchParams.get('totalFrom').value &&
                    !this.advancedSearchParams.get('totalTill').value) ||
                (this.advancedSearchParams.get('doseNumber').value &&
                    this.advancedSearchParams.get('doseNumber').errors) ||
                (this.advancedSearchParams.get('orderNumber').value &&
                    this.advancedSearchParams.get('orderNumber').errors) ||
                (!this.advancedSearchParams.get('custFrom').value &&
                    this.advancedSearchParams.get('custTill').value) ||
                (this.advancedSearchParams.get('custFrom').value &&
                    !this.advancedSearchParams.get('custTill').value)
            ) {
                return true;
            }

            if (this.advancedSearchParams.get('invoiceDateFrom').value === '') {
                this.advancedSearchParams.patchValue({
                    invoiceDateFrom: null
                });
            }
            if (this.advancedSearchParams.get('invoiceDateTill').value === '') {
                this.advancedSearchParams.patchValue({
                    invoiceDateTill: null
                });
            }
            if (this.advancedSearchParams.get('sendDateFrom').value === '') {
                this.advancedSearchParams.patchValue({
                    sendDateFrom: null
                });
            }
            if (this.advancedSearchParams.get('sendDateTill').value === '') {
                this.advancedSearchParams.patchValue({
                    sendDateTill: null
                });
            }

            this.togglePanel();
            console.log(this.advancedSearchParams);
            this.selectedParamsForSearch.emit(this.advancedSearchParams);
            return false;
        }
    }

    ngOnDestroy() {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
    }
}
