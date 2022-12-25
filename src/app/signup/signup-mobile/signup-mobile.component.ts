import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  Location,
  LocationStrategy,
  PathLocationStrategy
} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { TranslateService } from '@ngx-translate/core';
import {
  BankForeignCredentialsService,
  QuestionBase
} from '@app/shared/component/foreign-credentials/foreign-credentials.service';
import { SignupService } from '../signup.service';
import { TokenService, TokenStatus } from '@app/core/token.service';
import { ActivatedRoute, Router } from '@angular/router';
import { timer } from 'rxjs/internal/observable/timer';
import { map, switchMap } from 'rxjs/operators';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { takeWhileInclusive } from '@app/shared/functions/takeWhileInclusive';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../../login/auth.service';
import { AnalyticsService } from '@app/core/analytics.service';
import { UserService } from '@app/core/user.service';
import { StorageService } from '@app/shared/services/storage.service';
import { publishRef } from '@app/shared/functions/publishRef';

@Component({
  providers: [
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy }
  ],
  templateUrl: './signup-mobile.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SignupMobileComponent implements OnInit, OnDestroy, AfterViewInit {
  // currentStep: any;
  currentStepName: string;
  currentStepIdx: number | null = null;

  personal: any;
  business: any;
  account: any;
  tokenTrack: any;
  public showPopUpPreSighUp: boolean = false;
  // passwordHide = true;
  // isCapsLock = null;
  // isHebrew = false;
  // formInProgress = false;
  createdCompanyId: string = null;
  // banksCredentialSettings: any[] = null;
  tokenId: string | null = null;
  tokenStatus: Observable<any>;
  // private stopPollingTokenStatus = new Subject();
  private readonly MAX_POLLING_ATTEMPTS = 60;
  // isValidCellPart: boolean | null = null;

  banks: { label: string; value: string }[];
  foreignControls: QuestionBase<string>[] = null;
  public lite: boolean = false;

  readonly formInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  agreementId: string;
  private paramsSub: Subscription;

  constructor(
    public translate: TranslateService,
    private fb: FormBuilder,
    private bankForeignCreds: BankForeignCredentialsService,
    public userService: UserService,
    public storageService: StorageService,
    private signupService: SignupService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    public authService: AuthService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnDestroy(): void {
    console.log('');
    // this.stopPollingTokenStatus.next();
    // this.stopPollingTokenStatus.complete();
  }

  ngOnInit(): void {
    [this.personal, this.business, this.account, this.tokenTrack] = [
      this.createForm(Steps.PERSONAL_DATA),
      this.createForm(Steps.BUSINESS_DATA),
      this.createForm(Steps.ADD_ACCOUNT_OR_START_DEMO),
      this.createForm(Steps.TRACK_TOKEN_STATUS)
    ];

    // this.bankForeignCreds.banksSettingsAtSignup()
    //     .subscribe(rslt => {
    //         this.banksCredentialSettings = rslt;
    //         this.banks = Object.entries( this.banksCredentialSettings)
    //             .map(([key, val]) => {
    //                 return {
    //                     label: 'name' in val
    //                         ? val['name']
    //                         : this.translate.instant('banks.' + key),
    //                     value: key
    //                 };
    //             });
    //     });
    //
    // this.currentStep = this.personal;

    this.lite = this.route.snapshot.queryParams['biziboxType'] === 'regular';
    // const queryParams: string = this.route.snapshot.queryParams['biziboxType'];
    // if ((queryParams && queryParams === 'regular') || this.storageService.sessionStorageGetterItem('lite')) {
    //     this.storageService.sessionStorageSetter('lite', 'true');
    //     this.lite = true;
    // } else {
    //     this.lite = false;
    // }
    this.agreementId = this.route.snapshot.queryParams['agreementId'];
    // isracard
    // @ts-ignore
    if (this.agreementId === '11') {
    }
    // @ts-ignore
    if (
      this.agreementId === '11' ||
      this.route.snapshot.queryParams['biziboxType']
    ) {
      this.showPopUpPreSighUp = false;
    }

    this.router.navigate(['.'], { relativeTo: this.route });
    // this.paramsSub = this.route.paramMap
    //     .subscribe((params) => {
    //         this.agreementId = params.get('agreementId');
    //     });
  }

  ngAfterViewInit(): void {
    console.log('');
  }

  createForm(step: Steps): any {
    switch (step) {
      case Steps.PERSONAL_DATA:
        return (
          this.personal ||
          (this.personal = this.fb.group(
            {
              firstName: ['', [Validators.required, Validators.maxLength(30)]],
              lastName: ['', [Validators.required, Validators.maxLength(30)]],
              mail: new FormControl('', {
                validators: [Validators.required, Validators.email],
                asyncValidators: this.emailNotExistsValidator.bind(this),
                updateOn: 'blur'
              }),
              // mail: ['',
              //   Validators.compose([Validators.required, Validators.email]),
              //   this.emailNotExistsValidator.bind(this),
              //   {updateOn: 'blur'}],
              cell: [
                '',
                Validators.compose([
                  Validators.required,
                  Validators.minLength(10),
                  Validators.maxLength(11),
                  ValidatorsFactory.cellNumberValidatorIL
                ])
              ],
              password: [
                '',
                Validators.compose([
                  Validators.required,
                  Validators.minLength(8),
                  Validators.maxLength(12),
                  ValidatorsFactory.passwordValidatorBizibox
                ])
              ],
              agreementConfirm: [null, Validators.requiredTrue],
              marketingMessagesAgreed: [true]
            },
            {
              validators: ValidatorsFactory.fieldValuesAreDifferentValidator([
                'mail',
                'password'
              ])
            }
          ))
        );
      case Steps.BUSINESS_DATA:
        return (
          this.business ||
          (this.business = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(40)]],
            id: [
              '',
              Validators.compose([
                Validators.required,
                Validators.minLength(9),
                Validators.maxLength(9),
                Validators.pattern('\\d+'),
                ValidatorsFactory.idValidatorIL
              ]),
              [this.businessIdNotExistsValidator.bind(this)]
            ],
            profile: ['', [Validators.maxLength(30)]]
          }))
        );
      case Steps.ADD_ACCOUNT_OR_START_DEMO:
        return (
          this.account ||
          (this.account = this.fb.group({
            bank: [null, [Validators.required]]
          }))
        );
      // const fg = this.fb.group({
      //     bank: [null, [Validators.required]]
      // });
      //
      // fg.get('bank').valueChanges
      //     .subscribe(val =>
      //         this.rebuildAccountCredentialsControlsFor(val !== null ? val.value : null)
      //     );

      // return fg;
      case Steps.TRACK_TOKEN_STATUS:
        return this.tokenTrack || (this.tokenTrack = this.fb.group({}));
      default:
        return null;
    }
  }

  private emailNotExistsValidator(fc: AbstractControl) {
    const group = fc instanceof FormGroup ? fc : fc.parent;
    const req = {
      firstName: group.get('firstName').value,
      lastName: group.get('lastName').value,
      phoneNumber: group.get('cell').value,
      username: fc.value,
      hesderId: this.route.snapshot.params['aggreementId'] || null
    };
    return timer(500).pipe(
      switchMap(() => this.signupService.isEmailExists(req)),
      map((resp) => {
        return resp.body && resp.body.exists === false
          ? null
          : {
              emailExists: true
            };
      })
    );
  }

  private businessIdNotExistsValidator(g: FormControl) {
    const req = {
      companyHp: g.value,
      username: this.personal.get('mail').value
    };
    return this.signupService.isBusinessIdExists(req).pipe(
      map((resp) => {
        return resp.body && resp.body.exists === false
          ? null
          : {
              idExists: true
            };
      })
    );
  }

  //
  // handleKeyPress(e) {
  //     const str = String.fromCharCode(e.which);
  //     if (!str) {
  //         return;
  //     }
  //     this.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
  //     this.isCapsLock = (():any => {
  //         const charCode = e.which || e.keyCode;
  //         let isShift = false;
  //         if (e.shiftKey) {
  //             isShift = e.shiftKey;
  //         } else if (e.modifiers) {
  //             isShift = !!(e.modifiers & 4);
  //         }
  //
  //         if (charCode >= 97 && charCode <= 122 && isShift) {
  //             return true;
  //         }
  //         if (charCode >= 65 && charCode <= 90 && !isShift) {
  //             return true;
  //         }
  //
  //         this.isValidCellPart = e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
  //         console.log('e.target = %o, e.target.id = %o => %o return %o',
  //             e.target, e.target.id, e.target.id === 'cell', this.isValidCellPart);
  //         if ((this.isValidCellPart === false) || this.isHebrew) {
  //             e.preventDefault();
  //             e.stopPropagation();
  //         }
  //     })();
  // }
  //
  // handleKeyDown(e) {
  //     if (e.which === 20 && this.isCapsLock !== null) {
  //         this.isCapsLock = !this.isCapsLock;
  //     }
  // }
  //
  // onBack(group: any) {
  //     if (group === this.business) {
  //         this.currentStep = this.personal;
  //         // } else if (group === this.account) {
  //         //   this.currentStep = this.business;
  //     }
  // }
  //
  // onSubmit(group: any) {
  //     console.log('valid: %o, value: %o', group.valid, group.value);
  //
  //     if (group === this.personal) {
  //         this.currentStep = this.business;
  //         const req = {
  //             firstName: this.personal.get('firstName').value,
  //             lastName: this.personal.get('lastName').value,
  //             phoneNumber: this.personal.get('cell').value,
  //             username: this.personal.get('mail').value,
  //             hesderId: this.route.snapshot.params['aggreementId'] || null
  //         };
  //         this.signupService.updateLeadInfo(req).subscribe(() => {
  //         });
  //
  //     } else if (group === this.business) {
  //         const req = {
  //             companyInfo: {
  //                 businessCategory: this.business.get('profile').value,
  //                 companyHp: this.business.get('id').value,
  //                 companyName: this.business.get('name').value,
  //                 hesderId: this.route.snapshot.params['aggreementId'] || null
  //             },
  //             userInfo: {
  //                 firstName: this.personal.get('firstName').value,
  //                 lastName: this.personal.get('lastName').value,
  //                 cellPhone: this.personal.get('cell').value,
  //                 username: this.personal.get('mail').value,
  //                 password: this.personal.get('password').value,
  //             }
  //         };
  //
  //         this.formInProgress = true;
  //         this.signupService.signupCreate(req)
  //             .subscribe(() => {
  //                 this.formInProgress = false;
  //                 this.currentStep = this.account;
  //
  //                 this.signupService.getCompanies()
  //                     .subscribe(companyResult => {
  //                         this.createdCompanyId = Array.isArray(companyResult.body) && companyResult.body.length > 0
  //                             ? companyResult.body[0].companyId : null;
  //                     }, (error) => {
  //                         console.error('Default company fetch for created user failed.', error);
  //                     });
  //             }, () => {
  //                 this.formInProgress = false;
  //             });
  //     } else if (group === this.account) {
  //
  //         const bankCredsResult = this.getAccountCredentialsResults();
  //         if (bankCredsResult === null) {
  //             this.navigateToApplication();
  //             // this.router.navigate(['/'], {
  //             //     relativeTo: this.route
  //             // });
  //             return;
  //         }
  //
  //         const createOrUpdateTokenObs = !this.tokenId
  //             ? this.tokenService.tokenCreate(Object.assign({
  //                 'companyId': this.createdCompanyId
  //             }, bankCredsResult))
  //             : this.tokenService.tokenUpdate(Object.assign({
  //                 'companyId': this.createdCompanyId,
  //                 'tokenId': this.tokenId
  //             }, bankCredsResult));
  //
  //         this.formInProgress = true;
  //         createOrUpdateTokenObs.subscribe((resp) => {
  //             this.formInProgress = false;
  //             this.tokenId = this.tokenId || resp.body || null;
  //             if (this.tokenId) {
  //                 this.startTokenStatusPolling();
  //             }
  //             this.currentStep = this.tokenTrack;
  //         }, (error) => {
  //             console.error('Default company fetch for created user failed.', error);
  //             this.tokenId = null;
  //             this.formInProgress = false;
  //         });
  //
  //     } else if (group === this.tokenTrack) {
  //         this.navigateToApplication();
  //         // this.router.navigate(['/'], {
  //         //     relativeTo: this.route
  //         // });
  //     }
  // }

  startTokenStatusPolling(): void {
    this.tokenStatus = timer(3000, 5000).pipe(
      switchMap((i) => {
        return this.tokenService
          .tokenGetStatus({
            companyId: this.createdCompanyId,
            tokens: [this.tokenId]
          })
          .pipe(
            map((resp) => {
              const tknStat = resp[0];
              if (tknStat) {
                const respStatus = this.tokenService.toTokenStatusEnumValue(
                  tknStat.tokenStatus
                );
                if (
                  respStatus === null ||
                  [TokenStatus.New, TokenStatus.InProgress].includes(respStatus)
                ) {
                  tknStat['uiStatus'] =
                    i < this.MAX_POLLING_ATTEMPTS ? 'WAITING' : 'TIMED_OUT';
                } else if (
                  [
                    TokenStatus.Valid,
                    TokenStatus.VALIDPOALIMBAASAKIM,
                    TokenStatus.AboutToExpire
                  ].includes(respStatus) ||
                  this.tokenService.isTokenStatusProgressing(respStatus)
                ) {
                  tknStat['uiStatus'] = 'SUCCESS';
                } else if (
                  [
                    TokenStatus.TechnicalProblem,
                    TokenStatus.INVALIDPASSORDANDACCESS
                  ].includes(respStatus)
                ) {
                  tknStat['uiStatus'] = 'FAILURE';
                } else {
                  tknStat['uiStatus'] = 'UPDATE_AND_RETRY';
                }
              }
              return tknStat;
            })
          );
      }),
      takeWhileInclusive(
        (tknStat) => tknStat && tknStat['uiStatus'] === 'WAITING'
      ),
      publishRef
    );
  }

  onSkipToDemoCompanyClick(): void {
    this.analyticsService.notifyOnSignupSuccess();
    this.signupService.skipToDemoCompany().subscribe(() => {
      this.navigateToApplication('example');
    });
  }

  // toggleBankSelectContainer() {
  //     const dialogRef = this.dialog.open(BankOptionsDialogComponent, {
  //         // width: '250px',
  //         data: {
  //             options: this.banks,
  //             selection: this.account.get('bank').value
  //         },
  //         height: '100%',
  //         panelClass: ['bank-options-modal', 'isRTL']
  //     });
  //
  //     dialogRef.afterClosed()
  //         .pipe(
  //             filter(rslt => rslt)
  //         )
  //         .subscribe(result => {
  //             console.log('The dialog was closed %o', result);
  //             this.account.get('bank').setValue(result.selection);
  //             // this.animal = result;
  //         });
  // }
  //
  // private rebuildAccountCredentialsControlsFor(bankSelection: any): void {
  //     if (this.foreignControls) {
  //         this.foreignControls.forEach(fc => this.account.removeControl(fc.key));
  //         // this.bankCredentialsGroup.removeControl(this.otpTypeQuestionStub.key);
  //         // if (this.otpCodeQuestionStub !== null) {
  //         //     this.bankCredentialsGroup.removeControl(this.otpCodeQuestionStub.key);
  //         // }
  //     }
  //     this.account.removeControl('otpType');
  //     this.account.removeControl('otpCode');
  //
  //     const selectedSettings = bankSelection && this.banksCredentialSettings ? this.banksCredentialSettings[bankSelection] : null;
  //     if (!selectedSettings) {
  //         return;
  //     }
  //
  //     if (bankSelection === '122') {
  //         this.foreignControls = null;
  //         return;
  //     // } else if (bankSelection === '157' || bankSelection === '158') {
  //     //     this.foreignControls = this.banksCredentialSettings[selectedSettings.regularParent]
  //     //         .filter(fld => fld.key !== 'userCode')
  //     //         .map(fc => new QuestionBase(fc));
  //     //     // this.selectedSettings.otpTypes = this.selectedSettings.otpTypes.filter(otpt => otpt.value !== 'message');
  //     } else {
  //         this.foreignControls = selectedSettings.map(fc => new QuestionBase(fc));
  //         // this.bankForeignCreds.createControlsForBank(bankSelection);
  //     }
  //
  //     if (this.foreignControls && this.foreignControls.length) {
  //         this.foreignControls.forEach(fc => this.account.addControl(fc.key, this.bankForeignCreds.toFormControl(fc)));
  //     }
  //
  //     if (selectedSettings && selectedSettings.otp && selectedSettings.otpTypes) {
  //         const defaultOtpTypeToSelect = (bankSelection === '157' || bankSelection === '158')
  //             ? 'application' : selectedSettings.otpTypes[0].value;
  //         this.account.addControl('otpType',
  //             new FormControl(defaultOtpTypeToSelect, [Validators.required]));
  //
  //         this.rebuildAccountOtpControls(defaultOtpTypeToSelect);
  //         this.account.get('otpType').valueChanges.subscribe(val => this.rebuildAccountOtpControls(val));
  //     }
  // }
  //
  // private rebuildAccountOtpControls(otpType: string): void {
  //     this.account.removeControl('otpCode');
  //
  //     const selectedSettings = this.account.get('bank').value
  //              ? this.banksCredentialSettings[this.account.get('bank').value.value] : null;
  //
  //     // console.log('attachOtpControls: %o', otpType);
  //     const otpTypeSettings = selectedSettings.otpTypes.find(otpt => otpt.value === otpType);
  //
  //     if (otpTypeSettings.code) {
  //         const otpCodeQuestion = new QuestionBase<string>(Object.assign({
  //             key: 'otpCode',
  //             controlType: 'text'
  //         }, otpTypeSettings.code));
  //         this.account.addControl(otpCodeQuestion.key,
  //             this.bankForeignCreds.toFormControl(otpCodeQuestion));
  //     }
  // }
  //
  // private getAccountCredentialsResults(): any | null {
  //     if (this.foreignControls === null) {
  //         return null;
  //     }
  //
  //     const keyUsername = this.foreignControls[0].key,
  //         keyPassword = this.foreignControls.find(fc => fc.controlType === 'password').key,
  //         keyCode = this.foreignControls.length < 3
  //             ? 'otpCode'
  //             : this.foreignControls[1].controlType === 'password' ? this.foreignControls[2].key : this.foreignControls[1].key;
  //
  //     return {
  //         'bankAuto': this.account.contains(keyCode) ? this.account.get(keyCode).value : null,
  //         'bankId': this.account.get('bank').value.value,
  //         'bankPass': this.account.get(keyPassword).value,
  //         'bankUserName': this.account.get(keyUsername).value
  //     };
  //
  // }

  navigateToApplication(step: string) {
    this.userService.appData.landingToMobile = step;
    this.router.navigate(['/landingToMobile'], { queryParamsHandling: '' });
  }

  stepChangedTo($event: any) {
    console.log(
      'step changed to %o at %o',
      this.route.firstChild.routeConfig.path,
      this.route.routeConfig.children
        .map((ch) => ch.path)
        .indexOf(this.route.firstChild.routeConfig.path)
    );
    // $event);
    this.currentStepName = this.route.firstChild.routeConfig.path;
    this.currentStepIdx = this.route.routeConfig.children
      .map((ch) => ch.path)
      .indexOf(this.currentStepName);
  }

  onSkipToDemoCompanyMove(): void {
    this.signupService.skipToDemoCompany().subscribe(() => {
      this.navigateToApplication('example');
    });
  }
}

enum Steps {
  PERSONAL_DATA,
  BUSINESS_DATA,
  ADD_ACCOUNT_OR_START_DEMO,
  TRACK_TOKEN_STATUS
}
