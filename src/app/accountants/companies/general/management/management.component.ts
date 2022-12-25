import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
// import { OcrService } from '@app/accountants/companies/shared/ocr.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
// import { BrowserService } from '@app/shared/services/browser.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './management.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ManagementComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    public getExporterFileStatus: any;
    public error_exporterTokenId: boolean = false;
    public error_apiImportToken: boolean = false;
    public session: any = false;
    public companyList: any = false;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        // private ocrService: OcrService,
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
        this.session = false;
        this.getExporterFileStatus = null;
        this.sharedService
            .getExporterFileStatus({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                this.getExporterFileStatus = response ? response['body'] : response;
            });
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
                    .getExporterFileStatus({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        // accountantOfficeId: "4dfe9364-3fc7-3237-e053-650019ace89c"
                        // accountantOfficeName: "ש.א הנהלת חשבונות11 (ישראל אמינוב)"
                        // apiImportToken: "71b8b5cf-8402-7f01-e053-650019ac1802"
                        // dbName: "doublefashion"
                        // exporterTokenId: "baf7dc6f-1b8c-632b-e053-650019ac37f7"
                        // lastJobDate: null
                        // fileData: [,…]
                        // {
                        // exporterFileStatusId: "b515f95b-0989-430a-8b24-3faf7a3581cb", fileNumber: 2, fileName: "PAL_CODES",…}
                        // dataReceiveDate: 1656248130196
                        // exporterFileStatusId: "b515f95b-0989-430a-8b24-3faf7a3581cb"
                        // fileName: "PAL_CODES"
                        // fileNumber: 2
                        // lastDeltaDate: 1655727990489
                        // line: null
                        // show: true
                        // }

                        this.getExporterFileStatus = response ? response['body'] : response;
                    });
            });
    }


    startChild(): void {
        console.log('ManagementComponent');
    }

    trackById(index: number, val: any): number {
        return val.exporterFileStatusId;
    }

    updateValues(param: string) {
        if (param === 'apiImportToken') {
            this.sharedService
                .companyList({
                    apiToken: this.getExporterFileStatus['apiImportToken']
                })
                .subscribe(
                    (response: any) => {
                        const responseRest = response ? response['body'] : response;

                        this.companyList = {
                            data: responseRest,
                            companySelected: '',
                            apiImportToken: this.getExporterFileStatus['apiImportToken']
                        };
                    },
                    () => {
                    }
                );
        } else {
            this['error_' + param] = false;

            const params = {
                companyId: this.userService.appData.userData.companySelect.companyId
                // userId: this.userService.appData.userOnBehalf.id
            };
            params[param] = this.getExporterFileStatus[param];
            console.log('params: ', params);
            this.sharedService.updateExportToken(params).subscribe(
                () => {
                },
                () => {
                    this['error_' + param] = true;
                }
            );
        }
    }

    updateValuesModal() {
        if (this.companyList.accountantOfficeId) {
            this.sharedService
                .createApiToken({
                    accountantOfficeId: this.companyList.accountantOfficeId,
                    apiToken: this.companyList.apiImportToken,
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    dbName: this.companyList.companySelected.dbName,
                    dbStart: this.companyList.dbStart
                })
                .subscribe(
                    () => {
                        this.companyList = false;
                        this.session = false;
                        this.reload();
                    },
                    () => {
                        this.companyList = false;
                    }
                );
        } else {
            const params = {
                companyId: this.userService.appData.userData.companySelect.companyId
            };
            params['apiImportToken'] = this.companyList.apiImportToken;
            params['dbName'] = this.companyList.companySelected.dbName;

            console.log('params: ', params);
            this.sharedService.updateExportToken(params).subscribe(
                () => {
                    this.companyList = false;
                    this.session = false;
                    this.reload();
                },
                () => {
                    this.companyList = false;
                }
            );
        }
    }

    updateExporterFileStatus(exporterFileStatusId: any) {
        this.sharedService
            .updateExporterFileStatus({
                uuid: exporterFileStatusId
            })
            .subscribe(
                () => {
                    this.reload();
                },
                () => {
                }
            );
    }

    validUUID(uuid: any): boolean {
        const regexExp =
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
        if (uuid) {
            return regexExp.test(uuid);
        }
        return false;
    }

    openPopUpSession() {
        this.session = {
            error: false,
            apiToken: '',
            dbStart: ''
        };
    }

    validationSession() {
        const session = this.session;
        this.sharedService
            .companyList({
                apiToken: session.apiToken,
                dbStart: session.dbStart
            })
            .subscribe(
                (response: any) => {
                    const responseRest = response ? response['body'] : response;

                    this.companyList = {
                        data: responseRest.filter((it) =>
                            it.dbName.includes(session.dbStart)
                        ),
                        companySelected: '',
                        apiImportToken: session.apiToken,
                        dbStart: session.dbStart,
                        accountantOfficeId: this.getExporterFileStatus.accountantOfficeId
                    };
                },
                () => {
                }
            );

        // this.sharedService.validationSession({
        //     apiToken: session.apiToken,
        //     dbStart: session.dbStart
        // })
        //     .subscribe((res) => {
        //         // if (res.status === 200) {
        //         //     this.session = false;
        //         //     this.sharedService.updateApiToken({
        //         //         apiToken: session.apiToken,
        //         //         dbStart: session.dbStart,
        //         //         accountantOfficeId: this.getExporterFileStatus.accountantOfficeId
        //         //     })
        //         //         .subscribe(() => {
        //         //             this.reload();
        //         //         }, () => {
        //         //
        //         //         });
        //         // } else {
        //         //     this.session.error = true;
        //         // }
        //     }, () => {
        //         this.session.error = true;
        //     });
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
