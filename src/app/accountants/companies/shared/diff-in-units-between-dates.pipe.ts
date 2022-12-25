import {Pipe, PipeTransform} from '@angular/core';
import {UserService} from '@app/core/user.service';

@Pipe({
    name: 'diffInUnitsBetweenDates'
})
export class DiffInUnitsBetweenDatesPipe implements PipeTransform {
    constructor(public userService: UserService) {
    }

    transform(
        value: number | Date,
        units:
            | 'years'
            | 'months'
            | 'weeks'
            | 'days'
            | 'hours'
            | 'minutes'
            | 'seconds' = 'days',
        relativeTo?: number | Date
    ): any {
        if (!value) {
            return null;
        }

        return (
            !relativeTo
                ? this.userService.appData.moment(relativeTo)
                : this.userService.appData.moment()
        ).diff(value, units);
    }
}
