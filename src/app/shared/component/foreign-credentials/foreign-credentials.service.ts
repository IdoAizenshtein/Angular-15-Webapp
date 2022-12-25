import {FormBuilder, FormControl, ValidatorFn, Validators} from '@angular/forms';
import {Injectable} from '@angular/core';
import {ValidatorsFactory} from './validators';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class BankForeignCredentialsService {
    constructor(private fb: FormBuilder, private translate: TranslateService) {
    }

    // createControlsForBank(type: number | string): QuestionBase<string>[] {
    //   const foreignCredentials = this.banksSettings[type];
    //
    //   if (!Array.isArray(foreignCredentials)) {
    //     return [];
    //   }
    //
    //   return foreignCredentials.map(fc => new QuestionBase(fc));
    // }

    toFormControl<T>(question: QuestionBase<T>) {
        return new FormControl(question.value || '', question.validators);
    }

    banksSettings(): Observable<any[]> {
        return this.translate.get('foreignCredentials.banks');
        // return this.translate.translations[this.translate.currentLang].foreignCredentials.banks;
    }

    banksSettingsAtSignup(): Observable<any[]> {
        return this.banksSettings().pipe(
            map((rslt) => {
                const result = JSON.parse(JSON.stringify(rslt));
                ['157', '158']
                    .filter((id) => result[id] && Array.isArray(result[id].otpTypes))
                    .forEach((id) => {
                        result[id].otpTypes = result[id].otpTypes.filter(
                            (otpt) => otpt.value !== 'constant' && otpt.value !== 'message'
                        );
                    });

                return result;
            })
        );
    }
}

export class QuestionBase<T> {
    value: T;
    key: string;
    label: string;
    order: number;
    controlType: string;
    validators: ValidatorFn[];
    rules: string[];

    constructor(
        options: {
            value?: T;
            key?: string;
            label?: string;
            order?: number;
            controlType?: string;
            minLength?: number;
            maxLength?: number;
            pattern?: string;
            rules?: string[];
        } = {}
    ) {
        this.value = options.value;
        this.key = options.key || '';
        this.label = options.label || '';
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';

        this.rules = options.rules || [];
        this.validators = [Validators.required];
        if (
            !this.validators.length ||
            !this.validators.includes(Validators.required)
        ) {
            this.validators.push(Validators.required);
        }
        if (
            options.minLength !== undefined &&
            options.maxLength !== undefined &&
            options.pattern !== undefined
        ) {
            switch (options.pattern) {
                case 'numeric':
                    this.validators.push(
                        ...ValidatorsFactory.numericByLength(
                            options.minLength,
                            options.maxLength
                        )
                    );
                    break;
                case 'alphanumeric':
                    this.validators.push(
                        ...ValidatorsFactory.alphanumericASCIIByLength(
                            options.minLength,
                            options.maxLength
                        )
                    );
                    break;
                case 'noWhitespace':
                    this.validators.push(
                        ...ValidatorsFactory.nonWhitespaceByLength(
                            options.minLength,
                            options.maxLength
                        )
                    );
                    break;
            }
        } else {
            if (options.pattern !== undefined) {
                switch (options.pattern) {
                    case 'numeric':
                        this.validators.push(Validators.pattern(/^[0-9]+$/));
                        break;
                    case 'alphanumeric':
                        this.validators.push(Validators.pattern(/^[a-zA-Z0-9\-_@.]+$/));
                        break;
                    case 'noWhitespace':
                        this.validators.push(Validators.pattern(/^[\S]+$/));
                        break;
                }
            }
        }
    }
}
