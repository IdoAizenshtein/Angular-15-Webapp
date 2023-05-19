import {Component, OnInit, Optional, ViewEncapsulation} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {BrowserService} from '@app/shared/services/browser.service';
import {map, tap} from 'rxjs/operators';
import {ValidatorsFactory} from '../foreign-credentials/validators';
import {UserService} from '@app/core/user.service';
import {Dialog} from 'primeng/dialog';
import {SharedComponent} from "@app/shared/component/shared.component";
import {SignupService} from "@app/signup/signup.service";
import {Observable} from "rxjs";
import {SharedService} from "@app/shared/services/shared.service";

@Component({
    selector: 'add-company-dialog',
    templateUrl: './add-company-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class AddCompanyDialogComponent implements OnInit {


    private businessIdNotExistsValidator: AsyncValidatorFn = (g: AbstractControl): Observable<ValidationErrors> | null =>  {
        const req = {
            companyHp: g.value
        };
        return this.sharedService.isHpExistsForAccCompany(req).pipe(
            map((resp) => {
                return resp.body && resp.body.exists === false
                    ? null
                    : {
                        idExists: true
                    };
            })
        );
    }

    public readonly addCompanyForm: any = new FormGroup({
        companyName: new FormControl('', [Validators.required]),
        companyHp: new FormControl('', Validators.compose([Validators.required,
                ValidatorsFactory.idValidatorIL, Validators.maxLength(9),
                Validators.pattern('\\d+')]), this.businessIdNotExistsValidator.bind(this)),
        esderMaam: new FormControl(null),
        sourceProgram: new FormControl('',[Validators.required]),
        apiToken: new FormControl(null)
    });

    public sourcePrograms: Array<{
        name: string;
        enum: string;
    }>;

    public esderMaams: Array<{
        name: string;
        enum: string;
    }>

    public idExists: boolean

    constructor(
        @Optional() public dialog: Dialog,
        public userService: UserService,
        private signUpService: SignupService,
        private sharedService: SharedService,
        private sharedComponent: SharedComponent
    ) {
    }

    ngOnInit() {
        if (this.dialog) {
            this.dialog.draggable = false;
            this.dialog.resizable = false;
            this.dialog.responsive = false;
            this.dialog.minX = 0;
            this.dialog.minY = 0;
            this.dialog.showHeader = true;
            this.dialog.styleClass = 'add-company-dialog';
        }
        this.sourcePrograms =
            [
                {
                    name: "משרדית",
                    enum: "9995"
                },
                {
                    name: "פריוריטי",
                    enum: "9996"
                },
                {
                    name: "רווחית אונליין",
                    enum: "777"
                },
                {
                    name: "יצוא באמצעות קובץ אקסל",
                    enum: "150"
                }
        ];
        this.esderMaams =
            [
                {
                    name: "ללא מע”מ",
                    enum: "NONE"
                },
                {
                    name: "חודשי",
                    enum: "MONTH"
                },
                {
                    name: "דו-חודשי",
                    enum: "TWO_MONTH"
                }
            ]
    }


    submitAddCompany(): void {
        if (this.addCompanyForm.invalid) {
            BrowserService.flattenControls(this.addCompanyForm).forEach((ac) =>
                ac.markAsDirty()
            );
        } else {
            const paramAddCompanyForm = this.addCompanyForm.value;
            let createCompanyRequest = {
                companyHp: paramAddCompanyForm.companyHp,
                companyName: paramAddCompanyForm.companyName,
                esderMaam: paramAddCompanyForm.esderMaam,
                sourceProgramId: paramAddCompanyForm.sourceProgram,
                dbName: paramAddCompanyForm.sourceProgram === '777' ? paramAddCompanyForm.apiToken : null
            }
            this.sharedService
                .createAccountantCompany(createCompanyRequest)
                .pipe(tap(() => this.addCompanyForm.markAsDirty()))
                .subscribe((resp) => {
                    if (resp && !resp.error) {
                        if (this.dialog) {
                            this.sharedComponent.showAddCompaniesPopUp = false;
                            this.addCompanyForm.reset();
                        }
                    }
                });
        }
    }

    updateApiTokenValidation(): void {
        if (this.addCompanyForm.value.sourceProgram === '777') {
            this.addCompanyForm.get('apiToken').setValidators([Validators.required]);
            this.addCompanyForm.get('apiToken').updateValueAndValidity();
        } else {
            this.addCompanyForm.get('apiToken').setValidators([]);
            this.addCompanyForm.get('apiToken').updateValueAndValidity();
        }
    }
}
