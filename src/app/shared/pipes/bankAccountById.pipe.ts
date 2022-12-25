import {Pipe, PipeTransform} from '@angular/core';
import {UserService} from '@app/core/user.service';

@Pipe({
    name: 'asBankAccount',
    pure: true
})
export class BankAccountByIdPipe implements PipeTransform {
    constructor(public userService: UserService) {
    }

    transform(accountId: string): any {
        if (
            !accountId ||
            !this.userService.appData ||
            !this.userService.appData.userData.accounts
        ) {
            return undefined;
        }

        return this.userService.appData.userData.accounts.find(
            (acc:any) => acc.companyAccountId === accountId
        );
    }
}
