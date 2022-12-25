import {Component, ViewEncapsulation} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  UrlSegment,
  UrlSegmentGroup,
  UrlTree
} from '@angular/router';
import {ActivationService} from './activation.service';
import {UserService} from '@app/core/user.service';
import {StorageService} from '@app/shared/services/storage.service';
import {HttpServices} from '@app/shared/services/http.services';
import {FormBuilder} from '@angular/forms';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Location} from '@angular/common';
import {ErpService} from '../erp/erp.service';

@Component({
  templateUrl: './activation.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class ActivationComponent {
  alertText: string = 'הבקשה בעיבוד...';
  params_station: any;

  constructor(
    public translate: TranslateService,
    public activationService: ActivationService,
    public location: Location,
    private erpService: ErpService,
    public router: Router,
    public userService: UserService,
    public storageService: StorageService,
    public httpServices: HttpServices,
    private _fb: FormBuilder,
    public snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.userService = userService;
    // const url_string = window.location.href;
    // const url = new URL(url_string);
    // const uuid = url.searchParams.get('uuid');
    const url = this.location.path();
    const mainPath = this.getPathOfMainState(url);
    if (mainPath === 'activation') {
      const uuid: string = this.route.snapshot.queryParams['uuid'];
      // const uuid = window.location.search.split('uuid=')[1];
      if (uuid) {
        this.router.navigate(['.'], {
          relativeTo: this.route,
          queryParams: {}
        });
        activationService
          .activateUser({
            uuid: uuid
          })
          .subscribe({
            next: (response: any) => {
              this.alertText = 'המייל אומת בהצלחה!';
              this.userService.appData.isActivated = true;
              setTimeout(() => {
                this.goToSystem();
              }, 3000);
            },
            error: (err: HttpErrorResponse) => {
              this.alertText = 'המייל לא אומת!';
            },
            complete: () => console.info('complete')
          })
      }
    } else if (mainPath === 'activate-mail') {
      const mail: string = this.route.snapshot.queryParams['mail'];
      const stationId: string = this.route.snapshot.queryParams['stationId'];
      if (mail && stationId) {
        this.params_station = {
          mail: mail,
          stationId: stationId
        };
        this.router.navigate(['.'], {
          relativeTo: this.route,
          queryParams: {}
        });
        this.alertText = 'המייל אומת בהצלחה!';
        this.userService.appData.isActivated = true;
        this.erpService
          .updateActivation({
            stationId: this.params_station.stationId,
            mail: this.params_station.mail
          })
          .subscribe({
            next: (response: any) => {
              setTimeout(() => {
                this.goToSystem();
              }, 2000);
            },
            error: (err: HttpErrorResponse) => {
              setTimeout(() => {
                this.goToSystem();
              }, 2000);
            },
            complete: () => console.info('complete')
          })

        // this.erpService.sendActivationMailNotAuthorization({
        //     'stationId': stationId,
        //     'mail': mail
        // }).subscribe(
        //     response => {
        //         this.alertText = 'המייל אומת בהצלחה!';
        //         this.userService.appData.isActivated = true;
        //         setTimeout(() => {
        //             this.goToSystem();
        //         }, 3000);
        //     }, (err: HttpErrorResponse) => {
        //         this.alertText = 'המייל לא אומת!';
        //     }
        // );
      }
    }
  }


  getPathOfMainState(url: string): string {
    const tree: UrlTree = this.router.parseUrl(url);
    const g: UrlSegmentGroup = tree.root.children['primary'];
    const s: UrlSegment[] = g.segments;
    return s[0].path;
  }

  goToSystem() {
    const url = this.location.path();
    const mainPath = this.getPathOfMainState(url);
    if (mainPath === 'activate-mail') {
      this.router.navigate(['/api-account-management'], {
        relativeTo: this.route,
        queryParams: {
          station_id: this.params_station.stationId,
          bookKeepingId: 'DB8A6E85C7A146188CB9401DFDBB4F33'
        },
        queryParamsHandling: null
      });
    } else {
      this.router.navigate(['../'], {
        relativeTo: this.route,
        queryParamsHandling: ''
      });
    }
  }
}
