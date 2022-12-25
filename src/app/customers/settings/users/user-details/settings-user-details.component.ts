import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  combineLatest,
  defer,
  merge,
  of,
  throwError
} from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service'; // import {sharedService} from '../../../customers.service';
import {CustomersSettingsComponent} from '../../customers-settings.component';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {
  CompanyUser,
  SettingsUsersComponent
} from '../settings-users.component';
import {Location} from '@angular/common';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {SharedComponent} from '@app/shared/component/shared.component';
import {publishRef} from '@app/shared/functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
  templateUrl: './settings-user-details.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsUserDetailsComponent
  extends ReloadServices
  implements OnInit, OnDestroy {
  readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private readonly destroyed$ = new Subject<void>();

  userId$: Observable<string>;
  userId: any = null;

  readonly userDataForm = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    cellPhone: new FormControl('', {
      validators: [
        Validators.required,
        ValidatorsFactory.cellNumberValidatorIL
      ],
      updateOn: 'blur'
    }),
    mail: new FormControl('', {
      validators: [Validators.required, ValidatorsFactory.emailExtended],
      updateOn: 'blur'
    })
  });
  selectedUser$: Observable<CompanyUser>;
  selectedUserPrivs$: Observable<Array<CompanyUserPriv>>;
  getPrivsForUserData: any;
  isFormChanged: any = [];

  tokenAndAccountPrivsPrompt: {
    visible: boolean;
    target: CompanyUserPriv;
    tokenAndAccountPrivs: Array<CompanyUserTokenPriv>;
    accCount: number;
    username: string;
    form: any;
    show: (target: CompanyUserPriv) => void;
    approve: () => void;
  };

  usersAvailableForPrivsCopyPrompt: {
    visible: boolean;
    availableUsers$: any;
    selectedUserId: FormControl;
    show: () => void;
    approve: () => void;
  };

  @ViewChild('mainScrollContainer')
  mainScrollContainer: ElementRef<HTMLElement>;

  private pickedForCopyUser$: Subject<{ userId: string }> = new Subject();
  companiesWithPrivsRemoved$: Observable<string[]>;

  shouldSelectAlLeastOneCompanyOrAccount = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    public settingsComponent: CustomersSettingsComponent,
    public settingsUsers: SettingsUsersComponent,
    public userService: UserService,
    public override sharedComponent: SharedComponent,
    private location: Location
  ) {
    super(sharedComponent);

    this.tokenAndAccountPrivsPrompt = {
      target: null,
      tokenAndAccountPrivs: null,
      accCount: null,
      visible: false,
      username: null,
      form: null,
      show: (target: CompanyUserPriv) => {
        if (target) {
          this.tokenAndAccountPrivsPrompt.target = target;
          this.tokenAndAccountPrivsPrompt.accCount =
            target.tokenAndAccountPrivsSummary.overallAccounts;
          this.tokenAndAccountPrivsPrompt.username =
            [
              this.userDataForm.value.firstName,
              this.userDataForm.value.lastName
            ]
              .filter((val) => !!val && !!val.trim())
              .map((val) => val.trim())
              .join(' ') || 'המשתמש';
          this.tokenAndAccountPrivsPrompt.tokenAndAccountPrivs =
            target.tokenAndAccountPrivs;

          this.tokenAndAccountPrivsPrompt.form =
            this.tokenAndAccountPrivsPrompt.tokenAndAccountPrivs.reduce(
              (acmltr: any, tokenPriv) => {
                const tokenForm: any = new FormGroup({
                  tokenPrivValue: new FormControl(tokenPriv.tokenPrivValue)
                });
                acmltr.addControl(tokenPriv.token, tokenForm);
                if (!tokenPriv.isTokenEdit) {
                  tokenForm.controls.tokenPrivValue.disable();
                }

                if (Array(tokenPriv.accounts) && tokenPriv.accounts.length) {
                  tokenForm.addControl(
                    'accounts',
                    tokenPriv.accounts.reduce((acmltrAcc: any, acc) => {
                      acmltrAcc.addControl(
                        acc.companyAccountId,
                        new FormGroup({
                          accountPrivValue: new FormControl({
                            value: acc.accountPrivValue,
                            disabled: !acc.isAccountEdit
                          })
                        })
                      );
                      return acmltrAcc;
                    }, new FormGroup({}))
                  );
                }

                return acmltr;
              },
              new FormGroup({})
            );

          this.tokenAndAccountPrivsPrompt.visible = true;
        }
      },
      approve: () => {
        // console.log('this.tokenAndAccountPrivsPrompt.form => %o', this.tokenAndAccountPrivsPrompt.form.value);
        const formVal = this.tokenAndAccountPrivsPrompt.form.getRawValue();
        if (
          !Array.isArray(
            this.tokenAndAccountPrivsPrompt.target.tokenAndAccountPrivsBackup
          )
        ) {
          this.tokenAndAccountPrivsPrompt.target.tokenAndAccountPrivsBackup =
            JSON.parse(
              JSON.stringify(
                this.tokenAndAccountPrivsPrompt.target.tokenAndAccountPrivs
              )
            );
        }

        this.tokenAndAccountPrivsPrompt.tokenAndAccountPrivs.forEach(
          (tokenPriv) => {
            tokenPriv.tokenPrivValue = formVal[tokenPriv.token].tokenPrivValue;
            if (Array(tokenPriv.accounts) && tokenPriv.accounts.length) {
              tokenPriv.accounts.forEach((acc:any) => {
                acc.accountPrivValue =
                  formVal[tokenPriv.token].accounts[
                    acc.companyAccountId
                    ].accountPrivValue;
              });
            }
          }
        );
        this.tokenAndAccountPrivsPrompt.target.tokenAndAccountPrivsSummary =
          this.summarize(this.tokenAndAccountPrivsPrompt.tokenAndAccountPrivs);

        this.tokenAndAccountPrivsPrompt.visible = false;
      }
    };

    this.usersAvailableForPrivsCopyPrompt = {
      visible: false,
      availableUsers$: defer(() =>
        this.selectedUserPrivs$.pipe(
          switchMap((selectedUserPrivs) => {
            const companyIds = selectedUserPrivs.map(
              (companyPriv: CompanyUserPriv) => companyPriv.companyId
            );
            return this.sharedService.getUsersToCopyFor(companyIds).pipe(
              map((response: any) =>
                !response || response.error
                  ? []
                  : response.body.filter((it) => it.userId !== this.userId)
              ),
              tap((response: any) => {
                if (response.length) {
                  this.usersAvailableForPrivsCopyPrompt.selectedUserId.patchValue(
                    response[0].userId
                  );
                }
              })
            );
          })
        )
      ),
      selectedUserId: new FormControl('', Validators.required),
      show: () => {
        this.usersAvailableForPrivsCopyPrompt.visible = true;
      },
      approve: () => {
        this.usersAvailableForPrivsCopyPrompt.visible = false;
        this.pickedForCopyUser$.next({
          userId: this.usersAvailableForPrivsCopyPrompt.selectedUserId.value
        });
      }
    };
  }

  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }

  ngOnInit(): void {
    this.userId$ = this.route.paramMap.pipe(
      filter((params) => params.has('userId')),
      map((params) => params.get('userId')),
      publishRef,
      takeUntil(this.destroyed$)
    );

    this.selectedUser$ = combineLatest(

  [
    this.userId$,
    this.settingsUsers.selectedCompanyUsers$
  ]

    ).pipe(
      map(([userId, selectedCompanyUsers]) => {
        this.userId = userId;
        const selectedUser =
          userId !== 'new'
            ? selectedCompanyUsers.find(
              (companyUser) => companyUser.userId === userId
            )
            : {
              firstName: '',
              lastName: '',
              cellPhone: '',
              mail: ''
            };
        return selectedUser as CompanyUser;
      }),
      tap((selectedUser) => {
        this.userDataForm.reset(
          Object.assign(
            {
              mail: selectedUser ? selectedUser.userMail : null
            },
            selectedUser
          )
        );
        // if (selectedUser) {
        //     this.userDataForm.patchValue(Object.assign({}, selectedUser, {
        //         mail: (selectedUser as CompanyUser).userName
        //     }));
        // }
        // debugger;
        if (
          this.userDataForm.enabled === (selectedUser && !!selectedUser.userId)
        ) {
          if (selectedUser.userId) {
            this.userDataForm.disable();
          } else {
            this.userDataForm.enable();
          }
        }
      }),
      publishRef,
      takeUntil(this.destroyed$)
    );

    this.selectedUserPrivs$ = merge(
      this.selectedUser$,
      this.pickedForCopyUser$
    ).pipe(
      distinctUntilKeyChanged('userId'),
      switchMap((selectedUser) => {
        if (selectedUser) {
          return this.sharedService
            .getPrivsForUser(
              selectedUser.userId || '00000000-0000-0000-0000-000000000000'
            )
            .pipe(
              map((response: any) =>
                !response || response.error ? null : response.body
              )
            );
        }
        return of([]);
      }),
      tap((response: any) => {
        if (Array.isArray(response)) {
          this.isFormChanged = [];
          response.forEach((companyPriv: CompanyUserPriv, idx: number) => {
            if (this.getPrivsForUserData) {
              const it = this.getPrivsForUserData.find(
                (item) => item.companyId === companyPriv.companyId
              );
              if (it) {
                const isFormChanged =
                  (it.form.value.admin !== undefined &&
                    companyPriv.admin !== it.form.value.admin) ||
                  (it.form.value.anhash !== undefined &&
                    companyPriv.anhash !== it.form.value.anhash) ||
                  (it.form.value.companyName !== undefined &&
                    companyPriv.companyName !== it.form.value.companyName) ||
                  (it.form.value.ksafim !== undefined &&
                    companyPriv.ksafim !== it.form.value.ksafim) ||
                  (it.tokenAndAccountPrivs &&
                    JSON.stringify(it.tokenAndAccountPrivs) !==
                    JSON.stringify(companyPriv.tokenAndAccountPrivs));

                if (isFormChanged) {
                  this.isFormChanged.push(companyPriv.companyId);
                }
              }
            }
            companyPriv.form = new FormGroup({
              ksafim: new FormControl(companyPriv.ksafim),
              anhash: new FormControl(companyPriv.anhash),
              admin: new FormControl(companyPriv.admin),
              companyName: new FormControl(companyPriv.companyName)
            });

            companyPriv.form.valueChanges
              .pipe(
                filter((value:any) => {
                  // console.log('companyPriv.form.valueChanges ==> %o, %o',
                  //     value, companyPriv.form.enabled);
                  return (
                    companyPriv.form.enabled &&
                    (!('ksafim' in value) || value.ksafim === false) &&
                    (!('anhash' in value) || value.anhash === false)
                  );
                }),
                takeUntil(this.destroyed$)
              )
              .subscribe(() => companyPriv.form.disable());

            this.setControlsStateIn(companyPriv);
            companyPriv.form.updateValueAndValidity();
            companyPriv.tokenAndAccountPrivsSummary = this.summarize(
              companyPriv.tokenAndAccountPrivs
            );
          });
          this.getPrivsForUserData = response;
          const companiesWithSomePriv = response.filter(
            (companyPriv: CompanyUserPriv) =>
              companyPriv.ksafim || companyPriv.anhash
          );
          this.companiesWithPrivsRemoved$ = companiesWithSomePriv.length
            ? combineLatest(

          [
            companiesWithSomePriv.map((companyPriv: CompanyUserPriv) =>
                companyPriv.form.valueChanges.pipe(
                    startWith(companyPriv.form.value)
                )
            )
          ]

            ).pipe(
              map((formVals: any) => {
                return formVals
                  .filter((formVal) => !formVal.ksafim && !formVal.anhash)
                  .map((formVal) => formVal.companyName);
              })
            )
            : EMPTY;
        }
      }),
      publishRef,
      takeUntil(this.destroyed$)
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }

  private summarize(tokenAndAccountPrivs: Array<CompanyUserTokenPriv>): {
    overallAccounts: number;
    permittedAcounts: number;
  } {
    return {
      overallAccounts: Array.isArray(tokenAndAccountPrivs)
        ? tokenAndAccountPrivs.reduce(
          (acmltr, tkn) =>
            acmltr + (Array.isArray(tkn.accounts) ? tkn.accounts.length : 0),
          0
        )
        : 0,
      permittedAcounts: Array.isArray(tokenAndAccountPrivs)
        ? tokenAndAccountPrivs.reduce(
          (acmltr, tkn) =>
            acmltr +
            (Array.isArray(tkn.accounts)
              ? tkn.accounts.filter((acc:any) => acc.accountPrivValue).length
              : 0),
          0
        )
        : 0
    };
  }

  openAccountancyModuleFor(companyId: string) {
    window.open(
      this.location.prepareExternalUrl('/cfl/accountancy?id=' + companyId),
      '_blank'
    );
  }

  markAllPrivileges() {
    this.toggleAllPrivsTo(true);
  }

  unmarkAllPrivileges() {
    this.toggleAllPrivsTo(false);
  }

  private toggleAllPrivsTo(val: boolean) {
    this.selectedUserPrivs$.pipe(first()).subscribe((response: any) => {
      if (Array.isArray(response)) {
        response.forEach((companyPriv: CompanyUserPriv) => {
          this.toggleCompanyPrivOverall(companyPriv, val);
          companyPriv.form.patchValue({
            ksafim: companyPriv.editKsafim ? val : companyPriv.ksafim,
            anhash: companyPriv.editAnhash ? val : companyPriv.anhash,
            admin: companyPriv.adminEdit ? val : companyPriv.admin
          });

          companyPriv.tokenAndAccountPrivs.forEach((cutp) => {
            if (cutp.isTokenEdit) {
              cutp.tokenPrivValue = val;
            }
            cutp.accounts.forEach((acc:any) => (acc.accountPrivValue = val));
            companyPriv.tokenAndAccountPrivsSummary = this.summarize(
              companyPriv.tokenAndAccountPrivs
            );
          });
          //     const valueToPatch = {};
          //     if (companyPriv.editKsafim) {
          //         valueToPatch['ksafim'] = val;
          //     }
          //     if (companyPriv.editAnhash) {
          //         valueToPatch['anhash'] = val;
          //     }
          //     if (companyPriv.adminEdit) {
          //         valueToPatch['admin'] = val;
          //     }
          //     companyPriv.form.patchValue(valueToPatch);
          //     companyPriv.tokenAndAccountPrivs
          //         .forEach(cutp => {
          //             if (cutp.isTokenEdit) {
          //                 cutp.tokenPrivValue = val;
          //             }
          //             cutp.accounts
          //                 .forEach(acc => acc.)
          //         });
        });
      }
    });
  }

  commitChanges() {
    if (this.userDataForm.invalid) {
      BrowserService.flattenControls(this.userDataForm).forEach((ac) =>
        ac.markAsDirty()
      );

      requestAnimationFrame(() => {
        this.mainScrollContainer.nativeElement.scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'nearest'
        });
      });

      return;
    }

    this.shouldSelectAlLeastOneCompanyOrAccount = false;

    const createUserIfNewObs = this.selectedUser$.pipe(
      withLatestFrom(this.selectedUserPrivs$),
      switchMap(([selectedUser, selectedUserPrivs]) => {
        if (!selectedUser.userId) {
          if (
            !selectedUserPrivs.some((priv) => {
              return (
                Object.entries(priv.form.value).some(([k, v]) => v === true) &&
                priv.tokenAndAccountPrivsSummary.permittedAcounts > 0
              );
            })
          ) {
            throw new Error('No company/account permitted')
          }

          // debugger;
          return this.sharedService
            .createNewUser({
              firstName: this.userDataForm.value.firstName,
              lastName: this.userDataForm.value.lastName,
              phoneNumber: this.userDataForm.value.cellPhone,
              userMail: this.userDataForm.value.mail
            })
            .pipe(
              map((response: any) =>
                !response || response.error ? null : response.body
              ),
              tap((result) => {
                if (result) {
                  this.settingsUsers.showUserAddedPrompt(
                    this.userDataForm.value.firstName,
                    this.userDataForm.value.lastName
                  );
                }
              })
            );
        }
        return of(selectedUser.userId);
      })
    );

    const userPrivsUpdate = createUserIfNewObs.pipe(
      withLatestFrom(this.selectedUserPrivs$),
      switchMap(([userId, selectedUserPrivs]) => {
        const companiesToUpdate = selectedUserPrivs
          .filter((it) => {
            const isChanged =
              (this.isFormChanged.length &&
                this.isFormChanged.includes(it.companyId)) ||
              (it.form.value.admin !== undefined &&
                it.admin !== it.form.value.admin) ||
              (it.form.value.anhash !== undefined &&
                it.anhash !== it.form.value.anhash) ||
              (it.form.value.companyName !== undefined &&
                it.companyName !== it.form.value.companyName) ||
              (it.form.value.ksafim !== undefined &&
                it.ksafim !== it.form.value.ksafim) ||
              (it.tokenAndAccountPrivsBackup &&
                JSON.stringify(it.tokenAndAccountPrivsBackup) !==
                JSON.stringify(it.tokenAndAccountPrivs));
            return isChanged;
          })
          .map((priv) => {
            return Object.assign(
              Object.keys(priv)
                .filter(
                  (k) =>
                    ![
                      'form',
                      'tokenAndAccountPrivsSummary',
                      'tokenAndAccountPrivsBackup'
                    ].includes(k)
                )
                .reduce((acmltr, k) => {
                  acmltr[k] = JSON.parse(JSON.stringify(priv[k]));
                  return acmltr;
                }, Object.create(null)),
              priv.form.value
            );
          });

        if (Array.isArray(companiesToUpdate) && companiesToUpdate.length) {
          return this.sharedService
            .updatePrivsForUser({
              userId: userId,
              companies: companiesToUpdate
            })
            .pipe(
              map((response: any) =>
                !response || response.error ? null : response.body
              )
            );
        }
        return of(null);
      })
    );

    userPrivsUpdate.pipe(filter((response: any) => response)).subscribe(
      {
        next: () => {
          this.settingsUsers.forceReload$.next();
          this.router.navigate(['../'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
          });
        },
        error: (err) => {
          this.shouldSelectAlLeastOneCompanyOrAccount =
            err instanceof Error &&
            (<Error>err).message === 'No company/account permitted';
        }
      }
    );
  }

  private setControlsStateIn(companyPriv: any) {
    if (companyPriv && companyPriv.form) {
      if (
        companyPriv.editKsafim ||
        companyPriv.editAnhash ||
        companyPriv.adminEdit
      ) {
        if (!companyPriv.editKsafim) {
          companyPriv.form.controls.ksafim.disable();
        }
        if (!companyPriv.editAnhash) {
          companyPriv.form.controls.anhash.disable();
        }
        if (!companyPriv.adminEdit) {
          companyPriv.form.controls.admin.disable();
        }
      } else if (!companyPriv.form.disabled) {
        companyPriv.form.disable();
      }
    }
  }

  toggleCompanyPrivOverall(priv: CompanyUserPriv, $event: any) {
    priv.form.patchValue({
      ksafim: $event && priv.editKsafim ? priv.ksafim || !priv.anhash : false,
      anhash: $event && priv.editAnhash ? priv.anhash : false,
      admin: $event && priv.adminEdit ? priv.admin : false
    });
    // if (priv.editKsafim) {
    //     priv.form.patchValue({ksafim: $event});
    // }
    // if (priv.editAnhash) {
    //     priv.form.patchValue({anhash: $event});
    // }

    if (!Array.isArray(priv.tokenAndAccountPrivsBackup)) {
      priv.tokenAndAccountPrivsBackup = JSON.parse(
        JSON.stringify(priv.tokenAndAccountPrivs)
      );
    }

    if (!$event) {
      priv.tokenAndAccountPrivs.forEach((tokenPriv) => {
        // tokenPriv.isTokenEdit = false;
        if (tokenPriv.isTokenEdit) {
          tokenPriv.tokenPrivValue = false;
        }
        tokenPriv.accounts.forEach((acc:any) => (acc.accountPrivValue = false));
      });
    } else if (Array.isArray(priv.tokenAndAccountPrivsBackup)) {
      priv.tokenAndAccountPrivs = JSON.parse(
        JSON.stringify(priv.tokenAndAccountPrivsBackup)
      );
    }

    priv.tokenAndAccountPrivsSummary = this.summarize(
      priv.tokenAndAccountPrivs
    );

    if ($event !== priv.form.enabled) {
      if (priv.form.enabled) {
        priv.form.disable();
      } else {
        priv.form.enable();
        this.setControlsStateIn(priv);
      }
    }
  }
}

export class CompanyUserPriv {
  admin: boolean;
  adminEdit: boolean;
  anhash: boolean;
  companyId: string;
  companyName: string;
  editAnhash: boolean;
  editKsafim: boolean;
  ksafim: boolean;
  modelButton: boolean;
  tokenAndAccountPrivs: Array<CompanyUserTokenPriv>;
  form: any;
  tokenAndAccountPrivsSummary: {
    overallAccounts: number;
    permittedAcounts: number;
  };
  tokenAndAccountPrivsBackup: Array<CompanyUserTokenPriv>;
}

export class CompanyUserTokenPriv {
  accounts: Array<any>;
  isTokenEdit: boolean;
  token: string;
  tokenPrivValue: boolean;
}
