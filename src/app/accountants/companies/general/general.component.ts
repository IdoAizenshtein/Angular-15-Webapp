import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedService} from '@app/shared/services/shared.service';
import {filter, map, startWith, takeUntil, tap} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {SharedComponent} from '@app/shared/component/shared.component';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';

@Component({
    templateUrl: './general.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class GeneralComponent implements OnInit, OnDestroy {
    public personalInfo: any;
    public componentRefChild: any;
    public esderMaamArr = [
        {
            label: 'חד חודשי',
            value: 'MONTH'
        },
        {
            label: 'דו חודשי',
            value: 'TWO_MONTH'
        }
    ];
    public vatReportTypeArr = [
        {
            label: 'PCN',
            value: 'PCN'
        },
        {
            label: 'דיגיטלית',
            value: 'DIGITAL'
        },
        {
            label: 'שובר',
            value: 'REGULAR'
        }
    ];
    companyCustomerDetails$: Observable<any>;
    public scrollToCard: { companyId: string; creditCardId: string } = null;
    public getCompanyData$: Observable<any>;
    public companyDataObj: any = false;
    public rightSideTooltip: any = 0;
    private readonly destroyed$ = new Subject<void>();
    public modalPendeingServerRes: any = false;

    constructor(
        public userService: UserService,
        public sharedComponent: SharedComponent,
        private ocrService: OcrService,
        public sharedService: SharedService
    ) {
        // this.personalInfo = new FormGroup({
        //     esderMaam: new FormControl(null),
        //     vatReportType: new FormControl(null),
        //     expenseAsmachtaType: new FormControl(null),
        //     incomeAsmachtaType: new FormControl(null),
        //     pettyCashCustId: new FormControl(null)
        // });
    }

    startCounter() {
        this.modalPendeingServerRes = {
            resReceived: false,
            resReceivedComplete: false,
            Interval: null,
            seconds: 0,
            minutes: 0,
            secondsPresent: '00',
            minutesPresent: '00'
        };
        clearInterval(this.modalPendeingServerRes.Interval);
        this.modalPendeingServerRes.Interval = setInterval(() => {
            this.modalPendeingServerRes.seconds++;
            if (this.modalPendeingServerRes.seconds <= 9) {
                this.modalPendeingServerRes.secondsPresent = '0' + this.modalPendeingServerRes.seconds;
            }
            if (this.modalPendeingServerRes.seconds > 9) {
                this.modalPendeingServerRes.secondsPresent = String(this.modalPendeingServerRes.seconds);
            }
            if (this.modalPendeingServerRes.seconds > 59) {
                this.modalPendeingServerRes.minutes++;
                this.modalPendeingServerRes.minutesPresent = '0' + this.modalPendeingServerRes.minutes;
                this.modalPendeingServerRes.seconds = 0;
                this.modalPendeingServerRes.secondsPresent = '0' + 0;
            }
            if (this.modalPendeingServerRes.minutes > 9) {
                this.modalPendeingServerRes.minutesPresent = String(this.modalPendeingServerRes.minutes);
            }
        }, 1000);
    }

    resReceived(){
        this.modalPendeingServerRes.resReceivedComplete = true;
        setTimeout(()=>{
            this.modalPendeingServerRes.resReceived = true;
            clearInterval(this.modalPendeingServerRes.Interval);
            setTimeout(()=>{
                this.modalPendeingServerRes = false;
            }, 2000)
        }, 600)
    }

    get companyHpEmail(): string {
        if (
            this.userService.appData.userData.companySelect &&
            this.userService.appData.userData.companySelect.companyHp
        ) {
            return (
                (
                    '000000000' +
                    this.userService.appData.userData.companySelect.companyHp
                ).slice(-9) + '@biziboxcpa.com'
            );
        }
        return '';
    }

    eventRightPos(event: any) {
        this.rightSideTooltip =
            window.innerWidth -
            (event.target.parentElement.offsetLeft + event.target.offsetWidth) -
            33;
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
                this.getCompanyData$ = this.sharedService
                    .getCompanyData({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .pipe(
                        tap(() => {
                            this.companyDataObj = false;
                        }),
                        map((response: any) => {
                            if (response && !response.error && response.body) {
                                return response.body;
                            } else {
                                return {};
                            }
                        }),
                        tap((data: any) => {
                            this.companyDataObj = data;
                        })
                    );
            });

        // this.sharedComponent.getDataEvent
        //     .pipe(
        //         startWith(true),
        //         map(() => this.userService.appData && this.userService.appData.userData && this.userService.appData.userData.companySelect
        //             ? this.userService.appData.userData.companySelect.companyId : null),
        //         filter(companyId => !!companyId),
        //         takeUntil(this.destroyed$)
        //     )
        //     .subscribe(() => {
        //         this.personalInfo.patchValue({
        //             esderMaam: this.userService.appData.userData.companySelect.esderMaam,
        //             vatReportType: this.userService.appData.userData.companySelect.vatReportType,
        //             expenseAsmachtaType: this.userService.appData.userData.companySelect.expenseAsmachtaType ? this.userService.appData.userData.companySelect.expenseAsmachtaType.toString() : null,
        //             incomeAsmachtaType: this.userService.appData.userData.companySelect.incomeAsmachtaType ? this.userService.appData.userData.companySelect.incomeAsmachtaType.toString() : null
        //         });
        //         this.companyCustomerDetails$ = this.ocrService.companyGetCustomer({
        //             companyId: this.userService.appData.userData.companySelect.companyId,
        //             sourceProgramId: this.userService.appData.userData.companySelect.sourceProgramId
        //         })
        //             .pipe(
        //                 map(response => {
        //                     if (response && !response.error && Array.isArray(response.body) && response.body.length) {
        //                         response.body = response.body.map(it => {
        //                             return {
        //                                 custId: it.custId,
        //                                 lName: it.custLastName,
        //                                 hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
        //                                 id: it.palCode
        //                             };
        //                         });
        //                         this.personalInfo.patchValue({
        //                             pettyCashCustId: response.body.find(it => it.custId === this.userService.appData.userData.companySelect.pettyCashCustId)
        //                         });
        //                         return response.body;
        //                     } else {
        //                         return [];
        //                     }
        //                 }),
        //                 shareReplay(1)
        //             );
        //     });
    }

    // updateValues(param: string, val: string) {
    //     const pbj = {};
    //     pbj[param] = val;
    //     this.personalInfo.patchValue(pbj);
    //     this.updateCompany();
    // }
    //
    // updateCompany() {
    //     this.sharedService.updateDetails({
    //         'companyId': this.userService.appData.userData.companySelect.companyId,
    //         'esderMaam': this.personalInfo.value.esderMaam,
    //         'expenseAsmachtaType': this.personalInfo.value.expenseAsmachtaType,
    //         'incomeAsmachtaType': this.personalInfo.value.incomeAsmachtaType,
    //         'pettyCashCustId': this.personalInfo.value.pettyCashCustId ? this.personalInfo.value.pettyCashCustId.custId : null,
    //         'userId': null,
    //         'vatReportType': this.personalInfo.value.vatReportType
    //     }).subscribe(() => {
    //     });
    // }
    //
    // clearFilter(dropdown: Dropdown): void {
    //     dropdown.resetFilter();

    // }
    onActivate(componentRef: any) {
        this.componentRefChild = componentRef;
    }

    ngOnDestroy() {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
    }
}
