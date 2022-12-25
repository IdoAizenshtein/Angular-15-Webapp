import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Pipe({
    name: 'isToday',
    pure: true
})
export class IsTodayPipe implements PipeTransform {
    constructor(
        public translate: TranslateService,
        public userService: UserService
    ) {
    }

    transform(
        value: number | string | Date,
        ifTrue: any = this.translate.instant('langCalendar.today'),
        otherwise: any = ''
    ): any {
        if (!value) {
            return otherwise;
        }

        const mmnt = this.userService.appData.moment(value);
        if (!mmnt.isValid()) {
            return otherwise;
        }

        return mmnt.isSame(this.userService.appData.moment(), 'day')
            ? ifTrue
            : otherwise;
    }
}
