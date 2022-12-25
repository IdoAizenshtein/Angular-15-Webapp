import { Component, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@app/core/user.service';
import { StorageService } from '@app/shared/services/storage.service';
import { HttpServices } from '@app/shared/services/http.services';
import { FormBuilder } from '@angular/forms';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService } from '@app/shared/services/browser.service';

@Component({
  templateUrl: './landingToMobile.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class LandingToMobileComponent implements OnInit {
  public lite: boolean = false;

  constructor(
    public translate: TranslateService,
    private renderer: Renderer2,
    public router: Router,
    public userService: UserService,
    public storageService: StorageService,
    public httpServices: HttpServices,
    private _fb: FormBuilder,
    public snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.userService = userService;
    console.log(this.userService.appData.landingToMobile);
    if (BrowserService.isMobile) {
      this.renderer.addClass(document.body, 'isMobile');
    }
    if (!this.userService.appData.landingToMobile) {
      this.userService.appData.landingToMobile = 'regular';
    }
  }

  ngOnInit() {
    this.lite = this.route.snapshot.queryParams['biziboxType'] === 'regular';
    // const queryParams: string = this.route.snapshot.queryParams['biziboxType'];
    // if ((queryParams && queryParams === 'regular') || this.storageService.sessionStorageGetterItem('lite')) {
    //     this.storageService.sessionStorageSetter('lite', 'true');
    //     this.lite = true;
    // } else {
    //     this.lite = false;
    // }
  }

  goToAppStore() {
    const appLink = BrowserService.mobileAppLinkToStore();
    window.open(appLink, '_self');
  }
}
