import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Pipe({
    name: 'daysBetween',
    pure: true
})
export class DaysBetweenPipe implements PipeTransform {
    constructor(
        public translate: TranslateService,
        public userService: UserService
    ) {
    }

    transform(
        value: number | string | Date,
        till: number | string | Date = 'today'
    ): number | null {
        if (!value || !till) {
            return null;
        }

        const mmnt = this.userService.appData.moment(value);
        if (!mmnt.isValid()) {
            return null;
        }

        const mmntTill =
            till === 'today'
                ? this.userService.appData.moment()
                : this.userService.appData.moment(till);
        if (!mmntTill.isValid()) {
            return null;
        }

        return mmntTill.startOf('day').diff(mmnt.startOf('day'), 'days');
    }
}
