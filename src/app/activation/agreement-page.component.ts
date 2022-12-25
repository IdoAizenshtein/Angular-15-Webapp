import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  UrlSegment,
  UrlSegmentGroup,
  UrlTree
} from '@angular/router';
import { ActivationService } from './activation.service';
import { UserService } from '@app/core/user.service';
import { StorageService } from '@app/shared/services/storage.service';
import { HttpServices } from '@app/shared/services/http.services';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  Validators
} from '@angular/forms';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { ErpService } from '../erp/erp.service';
import { ErrorStateMatcher } from '@angular/material/core';

@Component({
  templateUrl: './agreement-page.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class AgreementPageComponent implements OnInit {
  public getContactInfo: any;
  public companyContactId: any = null;
  public confirmCheck: boolean = false;
  public marketInfo: boolean = false;
  public accountsInfo: boolean = false;
  public showAlertsThanks: boolean = false;
  public formInProgress = false;
  public otpInfo: any = {};
  public mailInfo: any = {};

  public preSending = false;

  public formLoginOtp: any;
  matcher = new MyErrorStateMatcher();
  public resendOtpCode: boolean = false;

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
    // const url = this.location.path();
    // const mainPath = this.getPathOfMainState(url);
    this.companyContactId = this.route.snapshot.queryParams['id'];
    if (this.companyContactId) {
      activationService.getContactInfo(this.companyContactId).subscribe(
        (response:any) => {
          this.getContactInfo = response ? response['body'] : response;
          // this.getContactInfo.accountantOfficeHp
          // this.getContactInfo.accountantOfficeName
          // this.getContactInfo.companyHp
          // this.getContactInfo.companyName
          // debugger
          // accountantOfficeHp: "540309101"
          // accountantOfficeName: "ש.א הנהלת חשבונות11 (ישראל אמינוב)"
          // companyHp: 514882265
          // companyName: "בדי1מנטוס"
        }
      );
    }

    // if (mainPath === 'activation') {
    //     const uuid: string = this.route.snapshot.queryParams['uuid'];
    //     // const uuid = window.location.search.split('uuid=')[1];
    //     if (uuid) {
    //         this.router.navigate(['.'], {relativeTo: this.route, queryParams: {}});

    //     }
    // } else if (mainPath === 'activate-mail') {
    //     const stationId: string = this.route.snapshot.queryParams['stationId'];
    //     if (mail && stationId) {
    //         this.params_station = {
    //             mail: mail,
    //             stationId: stationId
    //         };
    //         this.router.navigate(['.'], {relativeTo: this.route, queryParams: {}});
    //         this.alertText = 'המייל אומת בהצלחה!';
    //         this.userService.appData.isActivated = true;
    //         this.erpService.updateActivation({
    //             'stationId': this.params_station.stationId,
    //             'mail': this.params_station.mail
    //         }).subscribe(response => {
    //             setTimeout(() => {
    //                 this.goToSystem();
    //             }, 2000);
    //         }, (err: HttpErrorResponse) => {
    //             setTimeout(() => {
    //                 this.goToSystem();
    //             }, 2000);
    //         });
    //
    //         // this.erpService.sendActivationMailNotAuthorization({
    //         //     'stationId': stationId,
    //         //     'mail': mail
    //         // }).subscribe(
    //         //     response => {
    //         //         this.alertText = 'המייל אומת בהצלחה!';
    //         //         this.userService.appData.isActivated = true;
    //         //         setTimeout(() => {
    //         //             this.goToSystem();
    //         //         }, 3000);
    //         //     }, (err: HttpErrorResponse) => {
    //         //         this.alertText = 'המייל לא אומת!';
    //         //     }
    //         // );
    //     }
    // }
  }

  ngOnInit() {
    this.formLoginOtp = this._fb.group({
      code: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(new RegExp(/^-?[0-9][^\.]*$/))
        ])
      ]
    });
  }

  updateContactInfo(model?: any, isValid?: boolean, isOtpModal?: boolean, isEmail?:boolean) {
    if (isOtpModal) {
      if (!isValid || this.formInProgress) {
        return;
      }
      this.formInProgress = true;
      this.activationService
        .updateContactInfo({
          confirmed: true,
          companyContactId: this.companyContactId,
          marketingInfo: this.marketInfo,
          accountsInfo: this.accountsInfo,
          code: model.code
        })
        .subscribe(
          (response:any) => {
            const otpInfo = response ? response['body'] : response;
            this.formInProgress = false;
            if (!otpInfo.correctCode && this.marketInfo) {
              if(!isEmail){
                otpInfo.displayPhoneNumber = this.otpInfo.displayPhoneNumber;
                this.otpInfo = otpInfo;
              }else{
                otpInfo.displayEmail = this.mailInfo.displayEmail;
                this.mailInfo = otpInfo;
              }
              if ([400, 401, 403].includes(response.status)) {
                return this.formLoginOtp.setErrors({ incorrect: true });
              }
              return this.formLoginOtp.setErrors({
                wrongCode: true,
                incorrect: false
              });
            }
            // {
            //     "correctCode": true,
            //     "displayPhoneNumber": "string",
            //     "remainingAttempts": 0,
            //     "remainingResends": 0
            // }

            this.showAlertsThanks = true;
          }
        );
    } else {
      this.activationService
        .updateContactInfo({
          confirmed: true,
          companyContactId: this.companyContactId,
          marketingInfo: this.marketInfo,
          accountsInfo: this.accountsInfo
        })
        .subscribe(
          (response:any) => {
            // const otpInfo = (response) ? response['body'] : response;
            // if (!otpInfo.correctCode && this.marketInfo) {
            //     this.otpInfo = otpInfo;
            //     if ([400, 401, 403].includes(response.status)) {
            //         return this.formLoginOtp.setErrors({'incorrect': true});
            //     }
            //     return this.formLoginOtp.setErrors({'wrongCode': true, 'incorrect': false});
            // }
            // {
            //     "correctCode": true,
            //     "displayPhoneNumber": "string",
            //     "remainingAttempts": 0,
            //     "remainingResends": 0
            // }
            this.showAlertsThanks = true;
          }
        );
    }
  }

  resendOtp() {
    this.resendOtpCode = true;
    this.activationService.resendOtp(this.companyContactId).subscribe(
      (response:any) => {
        this.otpInfo = response ? response['body'] : response;
        // displayPhoneNumber
        setTimeout(() => {
          this.resendOtpCode = false;
        }, 3000);

        // {
        //     "correctCode": true,
        //     "displayPhoneNumber": "string",
        //     "remainingAttempts": 0,
        //     "remainingResends": 0
        // }
      }
    );
  }


  sendOtp() {
    this.preSending = false;
    this.activationService.sendOtp(this.companyContactId).subscribe(
      (response:any) => {
        this.otpInfo = response ? response['body'] : response;
        // displayPhoneNumber

        // {
        //     "correctCode": true,
        //     "displayPhoneNumber": "string",
        //     "remainingAttempts": 0,
        //     "remainingResends": 0
        // }
      }
    );
  }

  resendEmailOtp() {
    this.resendOtpCode = true;
    this.activationService.resendEmailOtp(this.companyContactId).subscribe(
        (response:any) => {
          this.mailInfo = response ? response['body'] : response;
          // displayPhoneNumber
          setTimeout(() => {
            this.resendOtpCode = false;
          }, 3000);

          // {
          //     "correctCode": true,
          //     "displayEmail": "string",
          //     "remainingAttempts": 0,
          //     "remainingResends": 0
          // }
        }
    );
  }
  sendMail() {
    this.preSending = false;
    this.activationService.sendMail(this.companyContactId).subscribe(
        (response:any) => {
          this.mailInfo = response ? response['body'] : response;
          // displayEmail

          // {
          //     "correctCode": true,
          //     "displayPhoneNumber": "string",
          //     "remainingAttempts": 0,
          //     "remainingResends": 0
          // }
        }
    );
  }

}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null | any
  ): boolean {
    const invalidCtrl = !!(control && control.invalid);
    const invalidParent = !!(
      control &&
      control.parent &&
      control.parent.invalid
    );
    return invalidCtrl || invalidParent;
  }
}
