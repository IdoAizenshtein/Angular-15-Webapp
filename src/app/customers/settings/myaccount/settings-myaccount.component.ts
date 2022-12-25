import {

  Component,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { AuthService } from '@app/login/auth.service';
import { Subject } from 'rxjs/internal/Subject';
import { UserService } from '@app/core/user.service';
import { ReloadServices } from '@app/shared/services/reload.services';
import { SharedComponent } from '@app/shared/component/shared.component';

@Component({
  templateUrl: './settings-myaccount.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsMyaccountComponent
  extends ReloadServices
  implements  OnDestroy
{
  public data: any = {};
  public tooltip: string = `כניסה רגילה היא כניסה באמצעות כתובת המייל
איתה נרשמתם למערכת והסיסמה  אותה בחרתם.
כניסה מחמירה היא כניסה רגילה שלאחריה נשלחת
הודעת טקסט עם קוד חד פעמי לנייד המקושר, בכל
פעם שתבקשו להכנס למערכת. ניתן לבטל כניסה
מחמירה דרך מסך זה בכל זמן.`;
  public popUpAuthenticationShow: any = false;
  public popUpReplaceMailShow: any = false;
  public dataAuth: any;
  public hide: boolean = true;
  public formMail: any;
  public hideMail: boolean = true;

  readonly changePasswordPrompt: {
    visible: boolean;
    processing: boolean;
    passwordHide: boolean;
    isHebrew: boolean;
    form: any;
    handleKeyPress: (any) => any;
    submit: () => void;
    reset: () => void;
  };

  private pristineData: any;

  constructor(
    private sharedService: SharedService,
    public _fb: FormBuilder,
    public authService: AuthService,
    public override sharedComponent: SharedComponent,
    public userService: UserService
  ) {
    super(sharedComponent);

    this.changePasswordPrompt = {
      visible: false,
      processing: false,
      passwordHide: true,
      isHebrew: false,
      form: _fb.group(
        {
          currPassword: [
            '',
            Validators.compose([
              Validators.required // ,
              // ValidatorsFactory.passwordValidatorBizibox
            ])
          ],
          newPassword: [
            '',
            Validators.compose([
              Validators.required,
              Validators.minLength(8),
              Validators.maxLength(12),
              ValidatorsFactory.passwordValidatorBizibox,
              ValidatorsFactory.passwordNotEqualToUsernameValidatorBizibox(
                this.authService.getLoggedInUsername()
              )
            ])
          ],
          newPasswordCnfrm: ['', Validators.compose([Validators.required])]
        },
        {
          validators: (fg: any) => {
            return fg.contains('newPassword') &&
            fg.contains('newPasswordCnfrm') &&
            fg.get('newPassword').value === fg.get('newPasswordCnfrm').value
              ? null
              : { passwordNotMatch: true };
          }
        }

      ),
      handleKeyPress: (e: any) => {
        const str = String.fromCharCode(e.which);
        if (!str) {
          return;
        }
        this.changePasswordPrompt.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
        const isCapsLock = (() => {
          const charCode = e.which || e.keyCode;
          let isShift = false;
          if (e.shiftKey) {
            isShift = e.shiftKey;
          } else if (e.modifiers) {
            isShift = !!(e.modifiers & 4);
          }

          if (charCode >= 97 && charCode <= 122 && isShift) {
            return true;
          }
          if (charCode >= 65 && charCode <= 90 && !isShift) {
            return true;
          }

          return false;
        })();

        if (this.changePasswordPrompt.isHebrew) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      submit: () => {
        this.changePasswordPrompt.processing = true;
        this.authService
          .replacePassword({
            oldPassword:
              this.changePasswordPrompt.form.get('currPassword').value,
            newPassword: this.changePasswordPrompt.form.get('newPassword').value
          })
          .subscribe((response:any) => {
            this.changePasswordPrompt.processing = false;
            if ([400, 403].includes(response.status)) {
              this.changePasswordPrompt.form.get('currPassword').setValue('');
              return this.changePasswordPrompt.form.setErrors({
                decline: true
              });
            } else if (response.status === 401) {
              return this.authService.logout();
            } else {
              this.changePasswordPrompt.visible = false;
            }
          });
      },
      reset: () => {
        this.changePasswordPrompt.form.reset();
        this.changePasswordPrompt.isHebrew = false;
        this.changePasswordPrompt.passwordHide = true;
      }
    };
  }
  ngOnDestroy(): void {
    this.destroy();
  }
  override reload() {
    console.log('reload child');
    this.startChild();
  }




  changeApplied(event: any): void {
    if (event) {
      this.popUpReplaceMailShow = false;
      setTimeout(() => {
        this.authService.logout();
      }, 200);
    } else {
      this.popUpReplaceMailShow = false;
    }
  }

  startChild() {
    this.sharedService.getUserSettings().subscribe(
      (response:any) => {
        this.data = response ? response['body'] : response;
        this.pristineData = JSON.parse(JSON.stringify(this.data));
      },
      (err: HttpErrorResponse) => {
        if (err.error) {
          console.log('An error occurred:', err.error.message);
        } else {
          console.log(
            `Backend returned code ${err.status}, body was: ${err.error}`
          );
        }
      }
    );
  }

  updateUser(): void {
    if (!this.data.firstName) {
      this.data.firstName = this.pristineData.firstName;
    }
    if (!this.data.lastName) {
      this.data.lastName = this.pristineData.lastName;
    }
    if (
      this.pristineData.firstName === this.data.firstName &&
      this.pristineData.lastName === this.data.lastName
    ) {
      return;
    }

    const parameters: any = {
      firstName: this.data.firstName,
      lastName: this.data.lastName
    };
    this.sharedService.updateUser(parameters).subscribe(
      (response:any) => {
        this.startChild();
      },
      (err: HttpErrorResponse) => {
        if (err.error) {
          console.log('An error occurred:', err.error.message);
        } else {
          console.log(
            `Backend returned code ${err.status}, body was: ${err.error}`
          );
        }
      }
    );
  }

  openEditAuthenticationType() {
    this.hide = true;
    this.popUpAuthenticationShow = {
      styleClass: 'authenticationTypePop',
      height: 244,
      width: 428,
      step: 1,
      type: this.data.authenticationType,
      footer: true,
      valid: true,
      processing$: new Subject<boolean>()
    };
  }

  nextStep() {
    if (this.popUpAuthenticationShow.step === 1) {
      this.popUpAuthenticationShow.processing$.next(true);
      this.sharedService.sendSms().subscribe(
        (response:any) => {
          this.popUpAuthenticationShow.processing$.next(false);
          this.dataAuth = response ? response['body'] : response;
          this.popUpAuthenticationShow.step += 1;
        },
        (err: HttpErrorResponse) => {
          this.popUpAuthenticationShow.processing$.next(false);
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );
    } else if (this.popUpAuthenticationShow.step === 2) {
      this.popUpAuthenticationShow.valid = true;
      this.popUpAuthenticationShow.processing$.next(true);
      this.sharedService[
        this.popUpAuthenticationShow.type === 'REGULAR'
          ? 'turnOnTwoPhaseForUser'
          : 'turnOffTwoPhaseForUser'
      ]({
        otpCode: this.dataAuth.otpCode,
        otpToken: this.dataAuth.token
      }).subscribe(
        (response:any) => {
          this.popUpAuthenticationShow.processing$.next(false);
          if (response && !response.error) {
            this.popUpAuthenticationShow.footer = false;
            this.popUpAuthenticationShow.step += 1;

            setTimeout(() => {
              this.popUpAuthenticationShow = false;
              this.startChild();
            }, 3000);
          } else {
            this.popUpAuthenticationShow.valid = false;
          }
        },
        (err: HttpErrorResponse) => {
          this.popUpAuthenticationShow.processing$.next(false);
          this.popUpAuthenticationShow.valid = false;
        }
      );
    }
  }

  cancelAuth() {
    if (this.popUpAuthenticationShow.step !== 3) {
      this.popUpAuthenticationShow.step = 4;
      setTimeout(() => {
        this.popUpAuthenticationShow = false;
      }, 3000);
    } else {
      this.popUpAuthenticationShow = false;
    }
  }

  openPopReplaceMail() {
    this.hideMail = true;
    this.formMail = this._fb.group({
      form: this._fb.group({
        mail: new FormControl('', {
          validators: [Validators.required, Validators.email],
          updateOn: 'blur'
        }),
        password: ['', <any>Validators.required]
      })
    });
    this.popUpReplaceMailShow = {
      styleClass: 'popUpReplaceMailShow',
      height: 418,
      width: 428,
      step: 1,
      footer: true,
      valid: true
    };
  }

  handleFocusUsername() {
    this.formMail.get('form')['controls'].mail.markAsUntouched();
  }

  nextStepMail(model: any) {
    const { mail, password } = model.form;
    this.sharedService
      .updateUserMail({
        mail: mail,
        password: password
      })
      .subscribe(
        (response:any) => {
          this.popUpReplaceMailShow.step += 1;
        },
        (err: HttpErrorResponse) => {
          this.formMail.get('form').setErrors({ incorrectPass: true });
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );
  }

  checkMailExists(): void {
    if (!this.formMail.get('form')['controls'].mail.invalid) {
      this.sharedService
        .checkMailExists(
          this.formMail.get('form')['controls'].mail.value.replace(/"/g, '')
        )
        .subscribe(
          (response:any) => {
            const isExist = response ? response['body'] : response;
            this.formMail.get('form').setErrors({ incorrect: isExist });
          },
          (err: HttpErrorResponse) => {
            if (err.error) {
              console.log('An error occurred:', err.error.message);
            } else {
              console.log(
                `Backend returned code ${err.status}, body was: ${err.error}`
              );
            }
          }
        );
    }
  }
}
