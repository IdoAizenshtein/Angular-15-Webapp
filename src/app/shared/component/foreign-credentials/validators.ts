import {
    AbstractControl,
    FormControl,
    FormGroupDirective,
    NgForm,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

export class ValidatorsFactory {
    static emailExtended = Validators.compose([
        Validators.email,
        // tslint:disable-next-line:max-line-length
        Validators.pattern(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ]);

    static cellNumberValidatorIL = Validators.pattern(
        '(050|051|052|053|054|055|057|058|02|03|04|08|09|072|073|076|077|078)-?\\d{7,7}'
    );

    static textByLength(min: number, max: number): ValidatorFn[] {
        const result = [];
        if (Number.isFinite(min)) {
            result.push(Validators.minLength(min));
        }
        if (Number.isFinite(max)) {
            result.push(Validators.maxLength(max));
        }
        return result;
    }

    static alphanumericASCII(): ValidatorFn[] {
        return [Validators.pattern(/^[a-zA-Z0-9\-_@.]+$/)];
    }

    static alphanumericASCIIByLength(min: number, max: number): ValidatorFn[] {
        return [
            ...ValidatorsFactory.textByLength(min, max),
            ...ValidatorsFactory.alphanumericASCII()
        ];
    }

    static numericByLength(min: number, max: number): ValidatorFn[] {
        return [
            ...ValidatorsFactory.textByLength(min, max),
            Validators.pattern(/^[0-9]+$/)
        ];
    }

    static nonWhitespaceByLength(min: number, max: number): ValidatorFn[] {
        return [
            ...ValidatorsFactory.textByLength(min, max),
            Validators.pattern(/^[\S]+$/)
        ];
    }

    static passwordValidatorBizibox(c: any) {
        const reDigit = new RegExp(/(?=.*\d)/);
        const reLetter = new RegExp(/(?=.*[a-zA-Z])/);
        const result: any = {};
        if (!reDigit.test(c.value)) {
            result.nodigit = true;
        }
        if (!reLetter.test(c.value)) {
            result.noletter = true;
        }
        return Object.keys(result).length === 0 ? null : result;
    }

    // static cellNumberValidatorIL(): ValidatorFn {
    //     return Validators.pattern('(050|052|053|054|055|057|058|02|03|04|08|09|072|073|076|077|078)-?\\d{7,7}');
    // }

    static idValidatorIL: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
        let result = false;
        if (c.value) {
            const digits = Array.from(
                String(c.value).replace(/\D/g, '').padStart(9, '0')
            ).map((ch) => +ch);

            if (digits.length === 9) {
                let sum = 0,
                    multiplyDigit = 0;

                for (let idx = 0; idx < digits.length; idx++) {
                    const dig = digits[idx];
                    if (idx % 2 === 1) {
                        multiplyDigit = dig * 2;
                        sum += multiplyDigit > 9 ? multiplyDigit - 9 : multiplyDigit;
                    } else {
                        sum += dig;
                    }
                }

                result = sum % 10 === 0;
            }
        }
        return !result ? {idILInvalid: true} : null;
    };

    static passwordNotEqualToUsernameValidatorBizibox(
        username: string
    ): ValidatorFn {
        return (c: AbstractControl) => {
            // console.log('passwordNotEqualToUsernameValidatorBizibox ==> "%o",  "%o" ==> %o',
            //     username, c.value, username === c.value || (c.value && username === c.value.trim()));
            if (!username || !c.value) {
                return null;
            }

            return username === c.value.trim() ? {sameAsUsername: true} : null;
        };
    }

    static fieldValuesAreDifferentValidator(
        fieldControlNames: string[]
    ): ValidatorFn {
        // debugger;
        if (!Array.isArray(fieldControlNames) || fieldControlNames.length < 2) {
            return Validators.nullValidator;
        }
        const responsePropName:any = fieldControlNames.join('SameAs');

        return (c: any): ValidationErrors | null => {
            // console.log('fieldValuesAreDifferentValidator ==> "%o",  "%o" ==> %o',
            //     fieldControlNames, c.value);
            // debugger;
            if (fieldControlNames.some((fcn) => !c.contains(fcn))) {
                return null;
            }
            const firstVal = c.controls[fieldControlNames[0]].value
                ? c.controls[fieldControlNames[0]].value.trim()
                : null;

            if (
                fieldControlNames.slice(1).some((fcn) => {
                    const cval = c.controls[fcn].value
                        ? c.controls[fcn].value.trim()
                        : null;
                    return firstVal === cval;
                })
            ) {
                const rslt:any = {};
                rslt[responsePropName] = true;
                return rslt;
            }

            return null;
        };
    }

    static fieldValuesAreDifferentErrorStateMatcher(
        fieldControlNames: string[]
    ): ErrorStateMatcher {
        const responsePropName = fieldControlNames.join('SameAs');
        return {
            isErrorState(
                control: FormControl | null,
                form: FormGroupDirective | NgForm | null | any
            ): boolean {
                const isSubmitted = form && form.submitted;
                return !!(
                    control &&
                    fieldControlNames.some(
                        (fcn) => form.control.controls[fcn] === control
                    ) &&
                    (form.hasError(responsePropName) || !control.valid) &&
                    (control.dirty || control.touched || isSubmitted)
                );
            }
        };
    }
}
