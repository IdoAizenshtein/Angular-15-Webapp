import {Component, EventEmitter, Output} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ValidatorsFactory} from '../foreign-credentials/validators';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {SharedComponent} from '@app/shared/component/shared.component';
import {publishRef} from '../../functions/publishRef'; //import {sharedComponent} from '../../../customers/customers.component';

@Component({
    selector: 'app-user-mail-edit',
    templateUrl: './user-mail-edit.component.html',
    preserveWhitespaces: false
})
export class UserMailEditComponent {
    passwordHide = true;
    isCapsLock = null;
    isHebrew = false;
    readonly mailReplacementForm: any;

    lastUserMailUpdate: Observable<any>;
    readonly processingMailUpdate: BehaviorSubject<boolean> = new BehaviorSubject(
        false
    );

    @Output() changeApplied = new EventEmitter<boolean>();

    constructor(
        private restCommonService: RestCommonService,
        public sharedComponent: SharedComponent
    ) {
        this.mailReplacementForm = new FormGroup({
            address: new FormControl('', {
                validators: [Validators.required, ValidatorsFactory.emailExtended],
                asyncValidators: this.emailNotExistsValidator.bind(this),
                updateOn: 'blur'
            }),
            password: new FormControl('', [
                Validators.required // ,
                // Validators.minLength(8),
                // Validators.maxLength(12),
                // ValidatorsFactory.passwordValidatorBizibox
            ])
        });
    }


    private emailNotExistsValidator(
        fc: AbstractControl
    ): Observable<ValidationErrors | null> {
        return this.restCommonService.checkMailExists(fc.value).pipe(
            map((response: any) => {
                const isExist = response ? response['body'] : response;
                return isExist ? {alreadyExists: isExist} : null;
            })
        );
    }

    handleKeyPress(e) {
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
        this.isCapsLock = ((): any => {
            const charCode = e.which || e.keyCode;
            let isShift = false;
            if (e.shiftKey) {
                isShift = e.shiftKey;
            } else if (e.modifiers) {
                // tslint:disable-next-line:no-bitwise
                isShift = !!(e.modifiers & 4);
            }

            if (charCode >= 97 && charCode <= 122 && isShift) {
                return true;
            }
            if (charCode >= 65 && charCode <= 90 && !isShift) {
                return true;
            }

            if (this.isHebrew) {
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

    submitMailReplacementForm() {
        if (this.mailReplacementForm.invalid) {
            BrowserService.flattenControls(this.mailReplacementForm).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        this.processingMailUpdate.next(true);
        this.lastUserMailUpdate = this.restCommonService
            .updateUserMail({
                mail: this.mailReplacementForm.value.address,
                password: this.mailReplacementForm.value.password
            })
            .pipe(
                catchError((err) =>
                    of({
                        error: err.message
                    })
                ),
                tap(() => this.processingMailUpdate.next(false)),
                publishRef
            );
    }
}
