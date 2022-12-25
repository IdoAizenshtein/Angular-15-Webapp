import {
  Component,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {filter, tap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {
  BankCredentialsComponent
} from '@app/shared/component/foreign-credentials/bank-credentials/bank-credentials.component';
import {TokenService} from '@app/core/token.service';
import {
  BankForeignCredentialsService,
  QuestionBase
} from '@app/shared/component/foreign-credentials/foreign-credentials.service';
import {SignupService} from '@app/signup/signup.service';
import {SignupMobileComponent} from '@app//signup/signup-mobile/signup-mobile.component';
import {TranslateService} from '@ngx-translate/core';
import {BankOptionsDialogComponent} from '../bank-options/bank-options-dialog.component';
import {MatLegacyDialog as MatDialog} from '@angular/material/legacy-dialog';
import {AnalyticsService} from '@app/core/analytics.service';

@Component({
  templateUrl: './signup-mobile-account-data.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SignupMobileAccountDataComponent {
  @ViewChild(BankCredentialsComponent)
  bankCredentialsComp: BankCredentialsComponent;

  readonly account: any;
  banksCredentialSettings: any[] = null;
  banks: { label: string; value: string }[];
  foreignControls: QuestionBase<string>[] = null;
  passwordHide = true;

  constructor(
    private translate: TranslateService,
    private tokenService: TokenService,
    private dialog: MatDialog,
    private bankForeignCreds: BankForeignCredentialsService,
    private route: ActivatedRoute,
    private router: Router,
    public parent: SignupMobileComponent,
    private signupService: SignupService,
    private analyticsService: AnalyticsService
  ) {
    this.account = parent.createForm(2);

    this.account
      .get('bank')
      .valueChanges.subscribe((val) =>
      this.rebuildAccountCredentialsControlsFor(
        val !== null ? val.value : null
      )
    );

    this.bankForeignCreds.banksSettingsAtSignup().subscribe((rslt) => {
      this.banksCredentialSettings = rslt;
      this.banks = Object.entries(this.banksCredentialSettings).map(
        ([key, val]) => {
          return {
            label:
              'name' in val
                ? val['name']
                : this.translate.instant('banks.' + key),
            value: key
          };
        }
      );
    });
  }

  toggleBankSelectContainer(): void {
    const dialogRef = this.dialog.open(BankOptionsDialogComponent, {
      // width: '250px',
      data: {
        options: this.banks,
        selection: this.account.get('bank').value
      },
      height: '100%',
      panelClass: ['bank-options-modal', 'isRTL']
    });

    dialogRef
      .afterClosed()
      .pipe(filter((rslt) => rslt))
      .subscribe((result) => {
        console.log('The dialog was closed %o', result);
        this.account.get('bank').setValue(result.selection);
        // this.animal = result;
      });
  }

  private rebuildAccountCredentialsControlsFor(bankSelection: any): void {
    if (this.foreignControls) {
      this.foreignControls.forEach((fc) => this.account.removeControl(fc.key));
      // this.bankCredentialsGroup.removeControl(this.otpTypeQuestionStub.key);
      // if (this.otpCodeQuestionStub !== null) {
      //     this.bankCredentialsGroup.removeControl(this.otpCodeQuestionStub.key);
      // }
    }
    this.account.removeControl('otpType');
    this.account.removeControl('otpCode');

    const selectedSettings =
      bankSelection && this.banksCredentialSettings
        ? this.banksCredentialSettings[bankSelection]
        : null;
    if (!selectedSettings) {
      return;
    }

    if (bankSelection === '122') {
      this.foreignControls = null;
      return;
      // } else if (bankSelection === '157' || bankSelection === '158') {
      //     this.foreignControls = this.banksCredentialSettings[selectedSettings.regularParent]
      //         .filter(fld => fld.key !== 'userCode')
      //         .map(fc => new QuestionBase(fc));
      //     // this.selectedSettings.otpTypes = this.selectedSettings.otpTypes.filter(otpt => otpt.value !== 'message');
    } else {
      this.foreignControls = selectedSettings.map((fc) => new QuestionBase(fc));
      // this.bankForeignCreds.createControlsForBank(bankSelection);
    }

    if (this.foreignControls && this.foreignControls.length) {
      this.foreignControls.forEach((fc) =>
        this.account.addControl(fc.key, this.bankForeignCreds.toFormControl(fc))
      );
    }

    if (selectedSettings && selectedSettings.otp && selectedSettings.otpTypes) {
      const defaultOtpTypeToSelect =
        bankSelection === '157' || bankSelection === '158'
          ? 'application'
          : selectedSettings.otpTypes[0].value;
      this.account.addControl(
        'otpType',
        new FormControl(defaultOtpTypeToSelect, [Validators.required])
      );

      this.rebuildAccountOtpControls(defaultOtpTypeToSelect);
      this.account
        .get('otpType')
        .valueChanges.subscribe((val) => this.rebuildAccountOtpControls(val));
    }
  }

  private rebuildAccountOtpControls(otpType: string): void {
    this.account.removeControl('otpCode');

    const selectedSettings = this.account.get('bank').value
      ? this.banksCredentialSettings[this.account.get('bank').value.value]
      : null;

    // console.log('attachOtpControls: %o', otpType);
    const otpTypeSettings = selectedSettings.otpTypes.find(
      (otpt) => otpt.value === otpType
    );

    if (otpTypeSettings.code) {
      const otpCodeQuestion = new QuestionBase<string>(
        Object.assign(
          {
            key: 'otpCode',
            controlType: 'text'
          },
          otpTypeSettings.code
        )
      );
      this.account.addControl(
        otpCodeQuestion.key,
        this.bankForeignCreds.toFormControl(otpCodeQuestion)
      );
    }
  }

  private getAccountCredentialsResults(): any | null {
    if (this.foreignControls === null) {
      return null;
    }

    const keyUsername = this.foreignControls[0].key,
      keyPassword = this.foreignControls.find(
        (fc) => fc.controlType === 'password'
      ).key,
      keyCode =
        this.foreignControls.length < 3
          ? 'otpCode'
          : this.foreignControls[1].controlType === 'password'
            ? this.foreignControls[2].key
            : this.foreignControls[1].key;

    return {
      bankAuto: this.account.contains(keyCode)
        ? this.account.get(keyCode).value
        : null,
      bankId: this.account.get('bank').value.value,
      bankPass: this.account.get(keyPassword).value,
      bankUserName: this.account.get(keyUsername).value
    };
  }

  onSubmit() {
    const bankCredsResult = this.getAccountCredentialsResults();
    if (bankCredsResult === null) {
      this.analyticsService.notifyOnSignupSuccess();
      this.parent.navigateToApplication('end');
      // this.router.navigate(['/'], {
      //     relativeTo: this.route
      // });
      return;
    }

    const createOrUpdateTokenObs = !this.parent.tokenId
      ? this.tokenService.tokenCreate(
        Object.assign(
          {
            companyId: this.parent.createdCompanyId
          },
          bankCredsResult
        )
      )
      : this.tokenService.tokenUpdate(
        Object.assign(
          {
            companyId: this.parent.createdCompanyId,
            tokenId: this.parent.tokenId
          },
          bankCredsResult
        )
      );

    this.parent.formInProgress$.next(true);
    createOrUpdateTokenObs
      .pipe(tap(() => this.parent.formInProgress$.next(false)))
      .subscribe(
        {
          next: (resp) => {
            this.parent.tokenId = this.parent.tokenId || resp.body || null;
            if (this.parent.tokenId) {
              this.parent.startTokenStatusPolling();
            }
            // this.currentStep = this.tokenTrack;
            this.signupService.lastFinishedStepIdx = this.parent.currentStepIdx;
            this.router.navigate(['../token-track'], {
              relativeTo: this.route,
              queryParamsHandling: 'preserve'
            });
          },
          error: (error) => {
            console.error(
              'Default company fetch for created user failed.',
              error
            );
            this.parent.tokenId = null;
            this.parent.formInProgress$.next(false);
          }
        }
      );
  }
}
