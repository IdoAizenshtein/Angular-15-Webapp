import {Component, Input, OnChanges, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {ValidatorsFactory} from '../foreign-credentials/validators';
import {timer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {SignupService} from '@app/signup/signup.service';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-company-editor',
    templateUrl: './company-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CompanyEditorComponent implements OnChanges {
    @Input() business: any;

    // readonly business: any;

    constructor(
        public userService: UserService,
        private signupService: SignupService,
        fb: FormBuilder
    ) {
        // this.business = fb.group({
        //     name: ['', [Validators.required, Validators.maxLength(40)]],
        //     id: ['', Validators.compose([
        //         Validators.required,
        //         Validators.minLength(9),
        //         Validators.maxLength(9),
        //         Validators.pattern('\\d+'),
        //         ValidatorsFactory.idValidatorIL
        //     ]),
        //         [this.businessIdNotExistsValidator.bind(this)]
        //     ],
        //     profile: ['', [Validators.maxLength(30)]]
        // });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['business'].currentValue) {
            // debugger;
            this.business.addControl(
                'name',
                new FormControl(null, [Validators.required, Validators.maxLength(40)])
            );
            this.business.addControl(
                'id',
                new FormControl(
                    null,
                    [
                        Validators.required,
                        Validators.minLength(9),
                        Validators.maxLength(9),
                        Validators.pattern('\\d+'),
                        ValidatorsFactory.idValidatorIL
                    ],
                    [this.businessIdNotExistsValidator.bind(this)]
                )
            );
            this.business.addControl(
                'profile',
                new FormControl(null, [Validators.maxLength(30)])
            );
        }

        // if (changes['source'] && changes['source'].currentValue) {
        //     this.setupSource(changes['seriesSource'].currentValue);
        // }
    }

    private businessIdNotExistsValidator(g: any) {
        // const req = {
        //     companyHp: g.value,
        //     username: this.userService.appData.userData.userName // this.personal.get('mail').value,
        // };
        return timer(300).pipe(
            switchMap(() =>
                this.signupService.isBusinessIdExists({
                    companyHp: g.value,
                    username: null // this.userService.appData.userData.userName // this.personal.get('mail').value,
                })
            ),
            map((resp) => {
                return resp.body && resp.body.exists === false
                    ? null
                    : {
                        idExists: true
                    };
            })
        );
    }
}
