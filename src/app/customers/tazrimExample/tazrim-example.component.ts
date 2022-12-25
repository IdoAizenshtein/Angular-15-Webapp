import { Component, ViewEncapsulation } from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component';
import { UserService } from '@app/core/user.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './tazrim-example.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class TazrimExampleComponent  {
  constructor(
    public sharedComponent: SharedComponent,
    public userService: UserService,
    public router: Router
  ) {}

  setExample() {
    this.userService.appData.userData.companySelect.companyIdSaved =
      this.userService.appData.userData.companySelect.companyId;
    this.sharedComponent.selectedValue.example = true;
    this.sharedComponent.step = 1;
    // this.userService.appData.userData.companySelect.example = true;
  }




}
