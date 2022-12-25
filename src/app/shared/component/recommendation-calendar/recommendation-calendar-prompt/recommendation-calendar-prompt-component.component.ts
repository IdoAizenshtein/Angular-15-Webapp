import {
    Component,
    EventEmitter,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {merge, Observable} from 'rxjs';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {filter, map, shareReplay} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
    RecommendationCalendarInlineComponent
} from '../recommendation-calendar-inline/recommendation-calendar-inline.component';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../../customers/customers.component';
import {BrowserService} from '@app/shared/services/browser.service';

@Component({
    selector: 'app-recommendation-calendar-prompt',
    templateUrl: './recommendation-calendar-prompt-component.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class RecommendationCalendarPromptComponent
    implements OnInit, OnChanges {
    readonly rcmndtnInputs: any;
    readonly rcmndtnInput$: Observable<{
        account: {
            companyAccountId: string;
            currency: string;
        };
        sum: string;
        month: number;
        year: number;
    }>;

    @Output() closed = new EventEmitter<any>();

    readonly step1Inputs: any;
    readonly months: { label: string; value: Date }[];
    readonly targetTypes: { label: string; value: string }[];
    currentStep = 'step-1';

    @ViewChild(RecommendationCalendarInlineComponent)
    recCal: RecommendationCalendarInlineComponent;

    readonly accountsUpToDate: Observable<any[]>;

    constructor(
        public userService: UserService,
        private restCommonService: RestCommonService,
        private translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        public sharedComponent: SharedComponent
    ) {
        this.rcmndtnInputs = new FormGroup({
            sum: new FormControl(null, {
                validators: [Validators.required],
                updateOn: 'blur'
            }),
            account: new FormControl(null, [Validators.required]),
            month: new FormControl(null, [Validators.required]),
            year: new FormControl(null, [Validators.required])
        });
        this.rcmndtnInput$ = this.rcmndtnInputs.valueChanges.pipe(
            filter(() => this.rcmndtnInputs.valid)
        );

        const monthNames = this.translate.instant(
            'langCalendar.monthNames'
        ) as string[];
        this.months = [];
        for (
            let iter = 0, dt = this.userService.appData.moment().startOf('month');
            iter < 6;
            iter++, dt.add(1, 'months')
        ) {
            this.months.push({
                label: monthNames[dt.month()] + ' ' + dt.year(),
                value: dt.toDate()
            });
        }

        const allPaymentTypes = this.translate.instant('paymentTypes');
        this.targetTypes = ['Checks', 'BankTransfer', 'Other'].map((nme) => {
            return {
                label: allPaymentTypes[nme],
                value: nme
            };
        });

        this.accountsUpToDate = merge(
            sharedComponent.getDataEvent,
            sharedComponent.forceAccountsReload$
        ).pipe(
            map(() => {
                if (this.userService.appData.userData.accounts) {
                    return this.userService.appData.userData.accounts.map((acc:any) => {
                        return {
                            bankId: acc.bankId,
                            currency: acc.currency,
                            accountNickname: acc.accountNickname,
                            companyAccountId: acc.companyAccountId,
                            disabled: !acc.isUpToDate
                        };
                    });
                }
            }),
            // map(() => {
            //     return this.userService.appData.userData.accounts
            //         .filter(acc => acc.isUpToDate);
            // }),
            shareReplay(1)
        );

        this.step1Inputs = new FormGroup({
            sum: new FormControl(null, {
                validators: [Validators.required]
            }),
            account: new FormControl(null, [Validators.required]),
            targetType: new FormControl(null, [Validators.required]),
            month: new FormControl(null, [Validators.required])
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('')
        // if (changes['companyId']) {
        //     this.rebuildMainLoader();
        // }
    }

    ngOnInit() {
        console.log('')
        // this.rebuildMainLoader();
        // this.step1Inputs.get('account').setValue(
    }

    proceedToStep2() {
        if (this.step1Inputs.invalid) {
            BrowserService.flattenControls(this.step1Inputs).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        this.currentStep = 'step-2';
        setTimeout(() => {
            const step1InputsVal = Object.assign(
                JSON.parse(JSON.stringify(this.step1Inputs.value)),
                {
                    month: (this.step1Inputs.value.month as Date).getMonth() + 1,
                    year: (this.step1Inputs.value.month as Date).getFullYear()
                }
            );
            // debugger;
            this.rcmndtnInputs.patchValue(step1InputsVal);
            // this.rcmndtnInputs.updateValueAndValidity();
        });
    }

    cancel(): void {
        this.closed.emit();
    }

    apply(): void {
        this.closed.emit();

        const preservedData = Object.assign(
            Object.create(null),
            this.step1Inputs.value,
            this.rcmndtnInputs.value,
            {
                selectedDate: this.recCal.selectedDate
            }
        );
        this.router
            .navigate(
                !this.userService.appData.userData.accountant
                    ? ['/', 'cfl', 'cash-flow', 'daily', 'details']
                    : ['/', 'accountants', 'companies', 'cash-flow', 'daily', 'details'],
                {
                    queryParamsHandling: 'preserve',
                    relativeTo: this.route
                }
            )
            .then((rslt) => {
                this.sharedComponent.recommendationPresetPublisher$.next(preservedData);
                // if (rslt) {
                //     this.userService.appData.userData.recommendationPreset = preservedData;
                // } else {
                //
                // }
            });
    }

    reset() {
        // debugger;
        this.rcmndtnInputs.reset();

        this.step1Inputs.reset({
            account: '',
            targetType: '',
            month: this.months[0].value
        });
        // this.step1Inputs.reset();
        // this.accountsUpToDate
        //     .subscribe((accs) => {
        //        const firstUpToDateAcc = accs.find(acc => !acc.disabled);
        //         this.step1Inputs.patchValue({
        //             account: firstUpToDateAcc ? firstUpToDateAcc : '',
        //             targetType: '', // 'Other'
        //             month: this.months[0].value
        //         });
        //     });

        requestAnimationFrame(() => {
            this.currentStep = 'step-1';
        });
    }
}
