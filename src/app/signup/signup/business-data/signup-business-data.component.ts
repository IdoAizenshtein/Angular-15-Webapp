import {Component, ViewEncapsulation} from '@angular/core';
import {switchMap, take, tap} from 'rxjs/operators';
import {SignupService} from '@app/signup/signup.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SignupComponent} from '@app/signup/signup/signup.component';

@Component({
    templateUrl: './signup-business-data.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SignupBusinessDataComponent {
    readonly business: any;

    constructor(
        private signupService: SignupService,
        private route: ActivatedRoute,
        private router: Router,
        public parent: SignupComponent
    ) {
        this.business = parent.createForm(1);
    }


    onSubmit() {
        const req = {
            companyInfo: {
                biziboxType: this.parent['lite'] ? 'regular' : 'business',
                businessCategory: this.business.get('profile').value,
                companyHp: this.business.get('id').value,
                companyName: this.business.get('name').value,
                hesderId: this.parent.agreementId
            },
            userInfo: {
                firstName: this.parent.personal.get('firstName').value,
                lastName: this.parent.personal.get('lastName').value,
                cellPhone: this.parent.personal.get('cell').value,
                username: this.parent.personal.get('mail').value,
                password: this.parent.personal.get('password').value
            }
        };
        this.parent.formInProgress$.next(true);
        this.signupService
            .signupCreate(req)
            .pipe(
                tap(() => this.parent.formInProgress$.next(false)),
                switchMap(() => this.signupService.getCompanies()),
                take(1)
            )
            .subscribe(
                {
                    next: (companyResult) => {
                        this.parent.createdCompanyId =
                            Array.isArray(companyResult.body) && companyResult.body.length > 0
                                ? companyResult.body[0].companyId
                                : null;

                        if (this.parent.createdCompanyId) {
                            this.signupService.lastFinishedStepIdx = this.parent.currentStepIdx;
                            this.router.navigate(['../account-data'], {
                                relativeTo: this.route,
                                queryParamsHandling: 'preserve'
                            });
                        }
                    },
                    error: () => {
                        this.parent.formInProgress$.next(false);
                    }
                }
            );
    }
}
