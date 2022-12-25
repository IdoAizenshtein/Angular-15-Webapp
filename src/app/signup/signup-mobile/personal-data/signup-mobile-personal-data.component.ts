import { Component, ViewEncapsulation } from '@angular/core';
import { SignupService } from '@app/signup/signup.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { take } from 'rxjs/operators';
import { SignupMobileComponent } from '@app/signup/signup-mobile/signup-mobile.component';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';

@Component({
  templateUrl: './signup-mobile-personal-data.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SignupMobilePersonalDataComponent  {
  passwordHide = true;
  isCapsLock = null;
  isHebrew = false;
  isValidCellPart: boolean | null = null;

  readonly personal: any;

  mailAndPasswordHaveDifferentValuesErrorStateMatcher =
    ValidatorsFactory.fieldValuesAreDifferentErrorStateMatcher([
      'mail',
      'password'
    ]);

  constructor(
    private signupService: SignupService,
    private route: ActivatedRoute,
    private router: Router,
    public parent: SignupMobileComponent
  ) {
    this.personal = parent.createForm(0);
  }





  handleKeyPress(e) {
    const str = String.fromCharCode(e.which);
    if (!str) {
      return;
    }
    this.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
    this.isCapsLock = (():any => {
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

      this.isValidCellPart =
        e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
      console.log(
        'e.target = %o, e.target.id = %o => %o return %o',
        e.target,
        e.target.id,
        e.target.id === 'cell',
        this.isValidCellPart
      );
      if (this.isValidCellPart === false || this.isHebrew) {
        e.preventDefault();
        e.stopPropagation();
      }
    })();
  }

  handleKeyDown(e) {
    if (e.which === 20 && this.isCapsLock !== null) {
      this.isCapsLock = !this.isCapsLock;
    }
  }

  onSubmit() {
    const req = {
      biziboxType: this.parent['lite'] ? 'regular' : 'business',
      firstName: this.parent.personal.get('firstName').value,
      lastName: this.parent.personal.get('lastName').value,
      phoneNumber: this.parent.personal.get('cell').value,
      username: this.parent.personal.get('mail').value,
      hesderId: this.parent.agreementId
    };
    this.signupService
      .updateLeadInfo(req)
      .pipe(take(1))
      .subscribe(() => {});

    this.signupService.lastFinishedStepIdx = this.parent.currentStepIdx;

    this.router.navigate(['../business-data'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve'
    });
  }
}
