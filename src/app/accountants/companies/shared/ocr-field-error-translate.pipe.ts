import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ValidationErrors} from '@angular/forms';

@Pipe({
    name: 'ocrFieldErrorTranslate'
})
export class OcrFieldErrorTranslatePipe implements PipeTransform {
    constructor(private translateService: TranslateService) {
    }

    transform(errors: ValidationErrors, args?: any): string {
        if (!errors) {
            return null;
        }

        return this.translateService.instant(
            'ocr-fields-validation-errors.' + Object.keys(errors)[0]
        );
    }
}
