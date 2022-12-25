import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './export.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ExportComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    public izuAsmachtaNumCharArr = [
        {
            label: 'כל הספרות',
            value: '0'
        },
        {
            label: '4 ספרות אחרונות',
            value: '4'
        },
        {
            label: '5 ספרות אחרונות',
            value: '5'
        },
        {
            label: '6 ספרות אחרונות',
            value: '6'
        },
        {
            label: '7 ספרות אחרונות',
            value: '7'
        },
        {
            label: '8 ספרות אחרונות',
            value: '8'
        },
        {
            label: '9 ספרות אחרונות',
            value: '9'
        }
    ];
    public dbYearHistoryArr: any;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public translate: TranslateService,
        public snackBar: MatSnackBar,
        public router: Router
    ) {
        super(sharedComponent);

        this.info = new FormGroup({
            izuAsmachtaNumChar: new FormControl({
                value: '',
                disabled: true
            }),
            izuFileExportType: new FormControl({
                value: '',
                disabled: true
            }),
            izuCreditType: new FormControl({
                value: '',
                disabled: true
            }),
            izuCreditValueDate: new FormControl({
                value: '',
                disabled: true
            })
        });
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
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
                this.sharedService.izu().subscribe((response: any) => {
                    const responseRest = response ? response['body'] : response;
                    // companyId: "909e0702-483b-1d4b-e053-650019accda1"
                    // izuAsmachtaNumChar: null
                    // izuCreditType: null
                    // izuCreditValueDate: null
                    // manager: false
                    // userId: "00000000-0000-0000-0999

                    this.info.patchValue({
                        izuFileExportType: responseRest.izuFileExportType
                            ? responseRest.izuFileExportType
                            : '1',
                        izuAsmachtaNumChar: responseRest.izuAsmachtaNumChar
                            ? responseRest.izuAsmachtaNumChar.toString()
                            : '0',
                        izuCreditType: responseRest.izuCreditType
                            ? responseRest.izuCreditType
                            : 'BANK_PAGE',
                        izuCreditValueDate: responseRest.izuCreditValueDate
                            ? responseRest.izuCreditValueDate
                            : 'TRANS_DATE'
                    });

                    if (responseRest.manager) {
                        this.info.get('izuAsmachtaNumChar').enable();
                        this.info.get('izuCreditType').enable();
                        this.info.get('izuCreditValueDate').enable();
                        this.info.get('izuFileExportType').enable();
                    }
                });
            });
    }


    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    updateValues(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateIzu();
    }

    updateIzu() {
        // debugger;
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        const params = {
            // companyId: this.userService.appData.userData.companySelect.companyId,
            izuFileExportType: this.info.get('izuFileExportType').value,
            izuAsmachtaNumChar: this.info.get('izuAsmachtaNumChar').value,
            izuCreditType: this.info.get('izuCreditType').value,
            izuCreditValueDate: this.info.get('izuCreditValueDate').value
        };

        console.log('params: ', params);
        this.sharedService.updateIzu(params).subscribe(() => {
        });
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }
}
