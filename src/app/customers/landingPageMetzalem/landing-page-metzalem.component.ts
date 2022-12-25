import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component';
import { UserService } from '@app/core/user.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { SignupService } from '@app/signup/signup.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Component({
  templateUrl: './landing-page-metzalem.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
// tslint:disable-next-line:class-name
export class landingPageMetzalemComponent implements OnDestroy, OnInit {
  readonly detailsForm: any;
  readonly formInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  showAlertsThanks: boolean = false;

  constructor(
    public sharedComponent: SharedComponent,
    public userService: UserService,
    private signupService: SignupService,
    public router: Router
  ) {
    this.detailsForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.pattern(/\s/)
      ]),
      phoneNumber: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(11),
        ValidatorsFactory.cellNumberValidatorIL
      ])
    });
  }

  ngOnInit() {
    console.log('ngOnInit')
  }

  submit() {
    this.formInProgress$.next(true);

    const req = {
      firstName: this.detailsForm.get('name').value.split(' ')[0],
      lastName: this.detailsForm.get('name').value.split(' ')[1],
      phoneNumber: this.detailsForm.get('phoneNumber').value,
      hesderId: 21,
      username: this.userService.appData.userData.mail
        ? this.userService.appData.userData.mail.trim()
        : null
    };
    this.signupService
      .updateLeadInfo(req)
      .pipe(take(1))
      .subscribe(() => {
        this.showAlertsThanks = true;
        this.signupService
          .newLead({
            companyId:
              this.userService.appData.userData.companySelect.companyId,
            fullName: this.detailsForm.get('name').value,
            phone: this.detailsForm.get('phoneNumber').value
          })
          .subscribe(() => {
            this.formInProgress$.next(false);

            setTimeout(() => {
              this.showAlertsThanks = false;
              this.router.navigate(['/cfl/archives'], {
                queryParamsHandling: 'preserve'
              }).then(r => {});
            }, 3000);
          });
      });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy')
  }
}
