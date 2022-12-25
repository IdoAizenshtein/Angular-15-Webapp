import { Component, ViewEncapsulation } from '@angular/core';
import { UserService } from '@app/core/user.service';

@Component({
  templateUrl: './customers-billing.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersBillingComponent {
  constructor(public userService: UserService) {}
}

export const PRE_HANDLED_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';
