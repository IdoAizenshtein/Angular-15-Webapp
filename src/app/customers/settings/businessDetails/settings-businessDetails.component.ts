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
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { ReloadServices } from '@app/shared/services/reload.services';
import { SharedComponent } from '@app/shared/component/shared.component';

@Component({
  templateUrl: './settings-businessDetails.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsBusinessDetailsComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  // public arrCompanies: any = [];
  // public subscription: Subscription;
  public personalInfo: any;
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
      contactMail: new FormControl('', {
        validators: [Validators.required, Validators.email]
      }),
      contactPhone: new FormControl(
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(11),
          ValidatorsFactory.cellNumberValidatorIL
        ])
      ),
      companyName: new FormControl(null, {
        validators: [Validators.required]
      }),
      businessCategory: new FormControl(null, {
        validators: [] // [Validators.required]
      }),
      city: new FormControl(null, {
        validators: []
      }),
      street: new FormControl(null, {
        validators: []
      }),
      mainContactName: new FormControl(null, {
        validators: [Validators.required]
      })
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
  this.sharedService.getCities(),
  this.settingsComponent.selectedCompany$
]

    )
      .pipe(takeUntil(this.destroyed$))
      .subscribe((resSub:any) => {
        const [cities, company] = resSub;
        // this.selectedCompany = company;
        if (!company) {
          this.personalInfo.reset();
        } else {
          this.personalInfo.reset(
            Object.assign(
              {
                city: Array.isArray(cities.body)
                  ? cities.body.find((seg) => seg.cityId === company.cityId)
                  : null
              },
              company
            )
          );
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
    const str = String.fromCharCode(e.which);
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
        e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
      console.log(
        'e.target = %o, e.target.id = %o => %o return %o',
        e.target,
        e.target.id,
        e.target.id === 'cell',
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
    debugger;
    if (this.personalInfo.valid) {
      let companyId;
      this.settingsComponent.selectedCompany$
        .pipe(
          filter((selectedCompany) => {
            const someIs = Object.entries(this.personalInfo.controls).some(([key, val]:any) => {
              if (key === 'city') {
                if (!val.value) {
                  return !!selectedCompany.cityId;
                }
                return selectedCompany.cityId !== val.value.cityId;
              }
              return selectedCompany[key] !== val.value;
            })
            return (
              selectedCompany !== null &&
              someIs
            );
          }),
          switchMap((selectedCompany) => {
            companyId = selectedCompany.companyId;
            const request = Object.assign(
              {
                cfiUser: selectedCompany.selfManaged === 2,
                companyId: selectedCompany.companyId,
                companyLogoPath: null,
                cityId: this.personalInfo.value.city
                  ? this.personalInfo.value.city.cityId
                  : null
              },
              this.personalInfo.value
            );
            return this.sharedService.updateCompany(request);
          }),
          switchMap(() => {
            this.userService.appData.userData.companies = null;
            return this.sharedService.getCompanies();
          })
        )
        .subscribe((companies: any) => {
          // debugger;

          this.userService.appData.userData.companies = companies.body;
          this.userService.appData.userData.companies.forEach((companyData) => {
            companyData.METZALEM =
              this.userService.appData.userData.accountant === false &&
              (companyData.privs.includes('METZALEM') ||
                (companyData.privs.includes('METZALEM') &&
                  companyData.privs.includes('KSAFIM')) ||
                (companyData.privs.includes('METZALEM') &&
                  companyData.privs.includes('ANHALATHESHBONOT')) ||
                (companyData.privs.includes('METZALEM') &&
                  companyData.privs.includes('KSAFIM') &&
                  companyData.privs.includes('ANHALATHESHBONOT')));
            if (companyData.METZALEM) {
              if (
                companyData.privs.includes('METZALEM') &&
                companyData.privs.includes('KSAFIM') &&
                companyData.privs.includes('ANHALATHESHBONOT')
              ) {
                companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
              } else if (
                companyData.privs.includes('METZALEM') &&
                companyData.privs.includes('KSAFIM')
              ) {
                companyData.METZALEM_TYPE = 'KSAFIM';
              } else if (
                companyData.privs.includes('METZALEM') &&
                companyData.privs.includes('ANHALATHESHBONOT')
              ) {
                companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
              } else if (companyData.privs.includes('METZALEM')) {
                companyData.METZALEM_TYPE = 'METZALEM';
              }
            }
            companyData.METZALEM_deskTrialExpired =
              companyData.METZALEM && !companyData.deskTrialExpired;
          });
          const companySelect = this.userService.appData.userData.companies.find(
              (co) =>
                  co.companyId ===
                  companyId
          );
          const companies_saved = this.userService.appData.userData.companies;
          this.sharedComponent.setNameOfCompany(
              companySelect,
              this.userService.appData.userData.companies
          );
          this.settingsComponent.arrCompanies$.next(
              companies_saved
          );
          this.settingsComponent.selectedCompany$.next(
              companySelect
          );
          // this.sharedComponent.setNameOfCompany(
          //     companySelect,
          //     companies_saved
          // );


          // this.sharedComponent.selectCompanyParam(companySelect);
          // this.settingsComponent.arrCompanies$.next(
          //     companies_saved
          // );
          // this.settingsComponent.selectedCompany$.next(
          //     companySelect
          // );
          // this.settingsComponent.onCompaniesResolved();




        });
    } else {
      this.personalInfo.updateValueAndValidity();
    }

    // if (this.personalInfo.valid
    //         && Object.entries(this.personalInfo.controls)
    //             .find(([key, val]) => {
    //                 if (key === 'city') {
    //                     return this.selectedCompany.cityId !== val.value.cityId;
    //                 }
    //                 return this.selectedCompany[key] !== val.value;
    //             })) {
    //     const request = Object.assign({
    //         cfiUser: true,
    //         companyId: this.selectedCompany.companyId,
    //         companyLogoPath: null,
    //         cityId: this.personalInfo.value.city.cityId
    //     }, this.personalInfo.value);
    //     this.sharedService.updateCompany(request)
    //         .subscribe(() => this.getCompanies());
    // }
    //
    // // if (valid === undefined || valid === true) {
    // //     this.sharedService.updateCompany({
    // //         'businessCategory': SettingsBusinessDetailsComponent.nullIfEmpty(
    // //             this.selectedValue.businessCategory),
    // //         'cfiUser': true,
    // //         'cityId': this.selectedValueCity ? this.selectedValueCity.cityId : null,
    // //         'companyId': this.selectedValue.companyId,
    // //         'companyLogoPath': null,
    // //         'companyName': SettingsBusinessDetailsComponent.nullIfEmpty(
    // //             this.selectedValue.companyName),
    // //         'contactMail': SettingsBusinessDetailsComponent.nullIfEmpty(
    // //             this.personalInfo.value.mail),
    // //         'contactPhone': SettingsBusinessDetailsComponent.nullIfEmpty(
    // //             this.personalInfo.value.cell),
    // //         'mainContactName': SettingsBusinessDetailsComponent.nullIfEmpty(
    // //             this.selectedValue.mainContactName),
    // //         'street': SettingsBusinessDetailsComponent.nullIfEmpty(this.selectedValue.street)
    // //     }).subscribe(
    // //         response => {
    // //             this.getCompanies();
    // //         }, (err: HttpErrorResponse) => {
    // //
    // //         }
    // //     );
    // // }
  }

  getCompanies() {
    this.userService.appData.userData.companies = null;
    this.sharedService.getCompanies().subscribe((companies: any) => {
      this.userService.appData.userData.companies = companies.body;
      this.userService.appData.userData.companies.forEach((companyData) => {
        companyData.METZALEM =
          this.userService.appData.userData.accountant === false &&
          (companyData.privs.includes('METZALEM') ||
            (companyData.privs.includes('METZALEM') &&
              companyData.privs.includes('KSAFIM')) ||
            (companyData.privs.includes('METZALEM') &&
              companyData.privs.includes('ANHALATHESHBONOT')) ||
            (companyData.privs.includes('METZALEM') &&
              companyData.privs.includes('KSAFIM') &&
              companyData.privs.includes('ANHALATHESHBONOT')));
        if (companyData.METZALEM) {
          if (
            companyData.privs.includes('METZALEM') &&
            companyData.privs.includes('KSAFIM') &&
            companyData.privs.includes('ANHALATHESHBONOT')
          ) {
            companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
          } else if (
            companyData.privs.includes('METZALEM') &&
            companyData.privs.includes('KSAFIM')
          ) {
            companyData.METZALEM_TYPE = 'KSAFIM';
          } else if (
            companyData.privs.includes('METZALEM') &&
            companyData.privs.includes('ANHALATHESHBONOT')
          ) {
            companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
          } else if (companyData.privs.includes('METZALEM')) {
            companyData.METZALEM_TYPE = 'METZALEM';
          }
        }
        companyData.METZALEM_deskTrialExpired =
          companyData.METZALEM && !companyData.deskTrialExpired;
      });
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
