import {

  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { UserService } from '@app/core/user.service';
import { SharedService } from '@app/shared/services/shared.service';
import { Dropdown } from 'primeng/dropdown/dropdown';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { CustomersSettingsComponent } from '../customers-settings.component';
import {combineLatest, Subject, zip} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReloadServices } from '@app/shared/services/reload.services';
import { SharedComponent } from '@app/shared/component/shared.component';

@Component({
  templateUrl: './settings-officeDetails.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsOfficeDetailsComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  // public arrCompanies: any = [];
  // public subscription: Subscription;
  public personalInfo: any;
  public officeHp: any = '';
  public isCapsLock = null;
  public isValidCellPart: boolean | null = null;
  private readonly destroyed$ = new Subject<void>();

  // selectedCompany: any;
  // private _selectedCompany: any;
  // get selectedCompany() {
  //     return this._selectedCompany;
  // }
  // set selectedCompany(val: any) {
  //     this._selectedCompany = val;
  //     this.selectCompany();
  // }

  static nullIfEmpty(s: string): string | null {
    const rslt = s ? s.trim() : null;
    return rslt && rslt.length > 0 ? rslt : null;
  }

  constructor(
    public userService: UserService,
    public settingsComponent: CustomersSettingsComponent,
    public override sharedComponent: SharedComponent,
    public sharedService: SharedService
  ) {
    super(sharedComponent);

    this.personalInfo = new FormGroup({
      officeName: new FormControl(
        {
          value: null,
          disabled: true
        },
        {
          validators: [Validators.required]
        }
      ),
      officeHp: new FormControl(
        {
          value: '',
          disabled: false
        },
        [
          Validators.required,
          Validators.maxLength(9),
          Validators.pattern('\\d+'),
          ValidatorsFactory.idValidatorIL
        ]
      ),
      officeCity: new FormControl(
        {
          value: null,
          disabled: true
        },
        {
          validators: []
        }
      ),
      officeAddress: new FormControl(
        {
          value: null,
          disabled: true
        },
        {
          validators: []
        }
      ),
      officeContact: new FormControl(
        {
          value: null,
          disabled: true
        },
        {
          validators: [Validators.required, Validators.pattern(/[^*0-9]/gi)]
        }
      ),

      officeMail: new FormControl(
        {
          value: '',
          disabled: true
        },
        {
          validators: [Validators.required, ValidatorsFactory.emailExtended]
        }
      ),
      officePhone: new FormControl(
        {
          value: null,
          disabled: true
        },
        Validators.compose([
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(11),
          ValidatorsFactory.cellNumberValidatorIL
        ])
      )
    });
  }


  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }
  ngOnInit(): void {
    // if (this.userService.appData.userData.companies) {
    //     this.startChild();
    // } else {
    //     this.subscription = this.settingsComponent.getDataEvent.subscribe(() => this.startChild());
    // }

    combineLatest(
  [
    this.sharedService.cities$,
    this.sharedService.accountantOfficeDetails$
  ]
    )
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([cities, company]) => {
        if (!company) {
          // this.personalInfo.reset();
        } else {
          company['manager'] = true;
          this.officeHp = company['officeHp'];
          this.personalInfo.patchValue({
            officeCity: Array.isArray(cities)
              ? cities.find((seg) => seg.cityName === company['officeCity'])
              : null,
            officeName: company['officeName'],
            officeHp: company['officeHp'],
            officeAddress: company['officeAddress'],
            officeContact: company['officeContact'],
            officeMail: company['officeMail'],
            officePhone: company['officePhone']
          });

          if (company['manager']) {
            this.personalInfo.get('officeName').enable();
            if (company['officeHp'] === null) {
              this.personalInfo.get('officeHp').enable();
            }
            this.personalInfo.get('officeCity').enable();
            this.personalInfo.get('officeAddress').enable();
            this.personalInfo.get('officeContact').enable();
            this.personalInfo.get('officeMail').enable();
            this.personalInfo.get('officePhone').enable();
          }
        }
      });
  }

  // startChild() {
  // if (this.userService.appData.userData.companies) {
  //     this.arrCompanies = JSON.parse(JSON.stringify(this.userService.appData.userData.companies));
  //     this.selectedCompany = this.arrCompanies[0];
  // }
  // }

  // selectCompany() {
  // this.settingsComponent.
  // this.sharedService.cities$.subscribe((rslt) => {
  //     this.personalInfo.reset(Object.assign({
  //             city: Array.isArray(rslt)
  //                 ? rslt.find(seg => seg.cityId === this.selectedCompany.cityId)
  //                 : null
  //         },
  //         this.selectedCompany));
  // });
  // }

  handleKeyPress(e) {
    let str;
    const clipboardData = e.clipboardData || e.clipboardData;
    if (clipboardData) {
      const pastedText = clipboardData.getData('text');
      str = String.fromCharCode(pastedText);
    } else {
      str = String.fromCharCode(e.which);
    }
    const pattern = /[^A-Za-z0-9\u0590-\u05FF @.]/gi;
    const testResult = pattern.test(str);
    console.log('testResult', testResult);
    if (
      testResult ||
      (e.target.id !== 'officeMail' && (str === '@' || str === '.'))
    ) {
      e.preventDefault();
      e.stopPropagation();
    }

    // const obj = {};
    // obj[e.target.id] = this.personalInfo.get(e.target.id).value.replace(/[^A-Za-z0-9\u0590-\u05FF @]/gi, '');
    // this.personalInfo.patchValue(obj);
    if (!str) {
      return;
    }
    this.isCapsLock = (():any => {
      const charCode = e.which || e.keyCode;
      let isShift = false;
      if (e.shiftKey) {
        isShift = e.shiftKey;
      } else if (e.modifiers) {
        isShift = !!(e.modifiers & 4);
      }

      if (charCode >= 97 && charCode <= 122 && isShift) {
        return true;
      }
      if (charCode >= 65 && charCode <= 90 && !isShift) {
        return true;
      }

      this.isValidCellPart =
        e.target.id === 'officePhone' ? /^[\d-]$/.test(str) : null;
      console.log(
        'e.target = %o, e.target.id = %o => %o return %o',
        e.target,
        e.target.id,
        e.target.id === 'officePhone',
        this.isValidCellPart
      );
      if (this.isValidCellPart === false) {
        e.preventDefault();
        e.stopPropagation();
      }
    })();
  }

  clearFilter(dropdown: Dropdown): void {
    dropdown.resetFilter();
  }

  // updateCompany(valid?: any) {
  updateCompany() {
    // debugger;
    if (this.personalInfo.valid) {
      const request = {
        officeName: this.personalInfo.get('officeName').value,
        officeHp: this.personalInfo.get('officeHp').value,
        officeCity: this.personalInfo.value.officeCity
          ? this.personalInfo.value.officeCity.cityId
          : null,
        officeAddress: this.personalInfo.get('officeAddress').value,
        officeContact: this.personalInfo.get('officeContact').value,
        officeMail: this.personalInfo.get('officeMail').value,
        officePhone: this.personalInfo.get('officePhone').value
      };
      this.sharedService.updateAccountantDetails(request).subscribe(() => {
        this.officeHp = this.personalInfo.get('officeHp').value;
      });
    } else {
      if (!this.personalInfo.get('officeHp').value) {
        this.personalInfo.patchValue({
          officeHp: this.officeHp
        });
      }
      this.personalInfo.updateValueAndValidity();
    }
  }

  getCompanies() {
    this.userService.appData.userData.companies = null;
    this.sharedService.getCompanies().subscribe((companies: any) => {
      this.userService.appData.userData.companies = companies.body;
      this.settingsComponent.onCompaniesResolved();
    });
  }

  ngOnDestroy(): void {
    // if (this.subscription) {
    //     this.subscription.unsubscribe();
    // }
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }
}
