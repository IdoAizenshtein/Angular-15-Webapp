import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '../../../core/user.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { ReloadServices } from '@app/shared/services/reload.services';

@Component({
  templateUrl: './customers-accountancy-example.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersAccountancyExampleComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public loader: boolean = false;
  public step: number = 1;
  public subscriptionTime: Subscription;

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService
  ) {
    super(sharedComponent);
  }
  override reload() {
    console.log('reload child');
  }
  ngOnInit(): void {
    this.runTimer();
  }

  runTimer() {
    this.subscriptionTime = timer(4000, 4000).subscribe((val) => {
      this.navSlider(+1, true);
    });
  }

  navSlider(num: number, isTimer?: boolean) {
    if (!isTimer) {
      this.subscriptionTime.unsubscribe();
      this.runTimer();
    }
    if (num === -1 && this.step === 1) {
      this.step = 3;
    } else if (num === +1 && this.step === 3) {
      this.step = 1;
    } else {
      this.step = this.step + num;
    }
  }

  ngOnDestroy(): void {
    if (this.subscriptionTime) {
      this.subscriptionTime.unsubscribe();
    }
    this.destroy();
  }
}
