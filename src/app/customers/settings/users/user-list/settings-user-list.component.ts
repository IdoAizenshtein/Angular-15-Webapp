import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  defer,
  of,
  throwError
} from 'rxjs';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {CustomersSettingsComponent} from '../../customers-settings.component';
import {
  finalize,
  first,
  map,
  mergeMap,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import {
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {BrowserService} from '@app/shared/services/browser.service';
import {
  CompanyUser,
  SettingsUsersComponent
} from '../settings-users.component';
import {ImmediateErrorStateMatcher} from '@app/login/resetPassword/resetPassword.component';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {ErrorStateMatcher} from '@angular/material/core';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
  templateUrl: './settings-user-list.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsUserListComponent
  extends ReloadServices
  implements OnInit, OnDestroy {
  // readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  // private readonly forceReload$ = new Subject<void>();
  private readonly destroyed$ = new Subject<void>();

  // selectedCompanyUsers$: Observable<Array<CompanyUser>>;
  selectedUser: CompanyUser;

  readonly deleteUserPrompt: {
    user: CompanyUser;
    foundInCompanies$: any;
    form: any;
    visible: boolean;
    loading$: BehaviorSubject<boolean>;
    approve: () => void;
  };

  readonly companySuperAdminPrivTransferPrompt: {
    candidate: CompanyUser;
    visible: boolean;
    loading$: BehaviorSubject<boolean>;
    otpVerifyStep: {
      immediateErrorMatcher: ErrorStateMatcher;
      confirmForm: any;
      reset: () => void;
      initiateCode$: Observable<any>;
      mayRetry: boolean;
      tryCount: number;
      submitForm: () => void;
      openTicket: () => void;
    };
    step: number;
    show: (candidate: CompanyUser) => void;
    hide: () => void;
  };

  constructor(
    private sharedService: SharedService,
    public settingsComponent: CustomersSettingsComponent,
    public settingsUsers: SettingsUsersComponent,
    public userService: UserService,
    public override sharedComponent: SharedComponent
  ) {
    super(sharedComponent);

    this.deleteUserPrompt = {
      user: null,
      form: new FormGroup({
        companies: new FormControl('', Validators.required)
      }),
      foundInCompanies$: defer(() => {
        this.deleteUserPrompt.loading$.next(true);
        this.deleteUserPrompt.form.reset();

        return this.sharedService
          .getCompaniesForUser(this.deleteUserPrompt.user.userId)
          .pipe(
            map((response: any) =>
              !response || response.error ? null : response.body
            ),
            tap((response: any) => {
              if (Array.isArray(response)) {
                this.deleteUserPrompt.form.setValue({
                  companies: response.map((company) => company.companyId)
                });
              }
            }),
            finalize(() => this.deleteUserPrompt.loading$.next(false))
          );
      }),
      visible: false,
      loading$: new BehaviorSubject(false),
      approve: () => {
        if (this.deleteUserPrompt.form.invalid) {
          BrowserService.flattenControls(this.deleteUserPrompt.form).forEach(
            (ac) => ac.markAsDirty()
          );
          return;
        }

        this.deleteUserPrompt.loading$.next(true);
        this.sharedService
          .deleteUser({
            deleteUserId: this.deleteUserPrompt.user.userId,
            companyIds: this.deleteUserPrompt.form.value.companies
          })
          .pipe(finalize(() => this.deleteUserPrompt.loading$.next(false)))
          .subscribe({
            next: (result) => {
              if (result && !result.error) {
                this.deleteUserPrompt.visible = false;
                this.settingsUsers.forceReload$.next();
              }
            }
          });
      }
    };

    this.companySuperAdminPrivTransferPrompt = {
      candidate: null,
      visible: false,
      loading$: new BehaviorSubject(false),
      otpVerifyStep: {
        immediateErrorMatcher: new ImmediateErrorStateMatcher(),
        confirmForm: new FormGroup({
          code: new FormControl('', [
            Validators.required,
            Validators.pattern(new RegExp(/^\d*$/))
          ]),
          token: new FormControl('', Validators.required)
        }),
        initiateCode$: defer(() => {
          return this.sharedService.sendSms().pipe(
            mergeMap((response: any) => {
              if (
                !response ||
                response.error ||
                !response.body.token ||
                [
                  'Incorrect one time token code',
                  'userNotfound',
                  'userNotFound'
                ].includes(response.body.token)
              ) {
                throw new Error('Could not trigger otp process')
              }
              return of(response.body);
            }),
            tap((otpTriggerResp: any) =>
              this.companySuperAdminPrivTransferPrompt.otpVerifyStep.confirmForm.patchValue(
                {token: otpTriggerResp.token}
              )
            ),
            publishRef
          );
        }),
        reset: () => {
          this.companySuperAdminPrivTransferPrompt.otpVerifyStep.confirmForm.reset();
          this.companySuperAdminPrivTransferPrompt.otpVerifyStep.mayRetry =
            true;
          this.companySuperAdminPrivTransferPrompt.otpVerifyStep.tryCount = 0;
        },
        mayRetry: true,
        tryCount: 0,
        submitForm: () => {
          if (
            this.companySuperAdminPrivTransferPrompt.otpVerifyStep.confirmForm
              .invalid
          ) {
            return;
          }

          this.companySuperAdminPrivTransferPrompt.otpVerifyStep.tryCount++;
          this.settingsComponent.selectedCompany$
            .pipe(
              takeUntil(this.destroyed$),
              tap(() =>
                this.companySuperAdminPrivTransferPrompt.loading$.next(true)
              ),
              switchMap((selectedCompany) => {
                return this.sharedService.replaceCompanySuperAdmin(
                  {
                    otpCode:
                    this.companySuperAdminPrivTransferPrompt.otpVerifyStep
                      .confirmForm.value.code,
                    otpToken:
                    this.companySuperAdminPrivTransferPrompt.otpVerifyStep
                      .confirmForm.value.token
                  },
                  {
                    companyId: selectedCompany.companyId,
                    otherUserId:
                    this.companySuperAdminPrivTransferPrompt.candidate.userId
                  }
                );
              }),
              mergeMap((response: any) => {
                if (!response || response.error) {
                  throw new Error(response ? response.error : 'Operation failed')
                }
                return of(response.body);
              }),
              finalize(() =>
                this.companySuperAdminPrivTransferPrompt.loading$.next(false)
              ),
              first()
            )
            .subscribe(
              {
                next: () => {
                  this.companySuperAdminPrivTransferPrompt.step++;
                  this.settingsComponent.selectedCompany$
                    .pipe(takeUntil(this.destroyed$), take(1))
                    .subscribe((selectedCmopany) => {
                      const privsAfterEdit = [
                        ...selectedCmopany.privs.filter(
                          (priv) => priv !== 'COMPANYSUPERADMIN'
                        ),
                        'COMPANYADMIN'
                      ];
                      selectedCmopany.privs = privsAfterEdit.filter(
                        (v, i) => privsAfterEdit.indexOf(v) === i
                      );
                    });
                },
                error: () => {
                  if (
                    !this.companySuperAdminPrivTransferPrompt.otpVerifyStep
                      .confirmForm.errors
                  ) {
                    this.companySuperAdminPrivTransferPrompt.otpVerifyStep.confirmForm.setErrors(
                      {
                        incorrect: true
                      }
                    );
                  }

                  this.companySuperAdminPrivTransferPrompt.otpVerifyStep.mayRetry =
                    this.companySuperAdminPrivTransferPrompt.otpVerifyStep
                      .tryCount < 3;
                }
              }
            );
        },
        openTicket: () => {
          this.companySuperAdminPrivTransferPrompt.visible = false;
          this.sharedComponent.showOpenTicket();
        }
      },
      step: 0,
      show: (candidate: CompanyUser) => {
        if (candidate) {
          this.companySuperAdminPrivTransferPrompt.step = 0;
          this.companySuperAdminPrivTransferPrompt.otpVerifyStep.reset();
          this.companySuperAdminPrivTransferPrompt.candidate = candidate;
          this.companySuperAdminPrivTransferPrompt.visible = true;
        }
      },
      hide: () => {
        this.companySuperAdminPrivTransferPrompt.visible = false;
      }
    };
  }

  override reload() {
    console.log('reload child');
  }

  ngOnInit(): void {
    console.log('ngOnInit')
    // this.selectedCompanyUsers$ = merge(
    //     this.settingsComponent.selectedCompany$,
    //     this.forceReload$
    //         .pipe(
    //             switchMap(() => this.settingsComponent.selectedCompany$)
    //         )
    // )
    //     .pipe(
    //         filter(val => val !== null),
    //         tap(() => this.loading$.next(true)),
    //         switchMap(selectedCompany => this.sharedService.getUsersForCompany(selectedCompany.companyId)),
    //         tap(() => this.loading$.next(false), () => this.loading$.next(false)),
    //         map(response => !response || response.error ? null : response.body),
    //         takeUntil(this.destroyed$)
    //     );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }

  // minSelectedRequiredValidator(min = 1) {
  //   const validators: ValidatorFn = (formArray: FormArray) => {
  //     const totalSelected = formArray.controls
  //       .map((control) => control.value)
  //       .reduce((prev, next) => (next ? prev + next : prev), 0);
  //     return totalSelected >= min ? null : { required: true };
  //   };
  //
  //   return validators;
  // }
}
