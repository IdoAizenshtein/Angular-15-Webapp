import {

  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { UserService } from '@app/core/user.service';
import { CustomersSettingsComponent } from '../customers-settings.component';
import { SharedService } from '@app/shared/services/shared.service';
import {Observable, zip, of, combineLatest} from 'rxjs';
import { SharedComponent } from '@app/shared/component/shared.component';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Paginator } from 'primeng/paginator';
import { TranslateService } from '@ngx-translate/core';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { map } from 'rxjs/operators';
import { RestCommonService } from '@app/shared/services/restCommon.service';
import { Dropdown } from 'primeng/dropdown/dropdown';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ReloadServices } from '@app/shared/services/reload.services';
import { HttpErrorResponse } from '@angular/common/http';

// import {AutoComplete} from 'primeng/components/autocomplete/autocomplete';

@Component({
  templateUrl: './settings-officeUsers.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsOfficeUsersComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public hasPermission: any = false;
  public officeUsers: any = false;
  public loader = true;
  public loaderTableSwap = false;
  public officeUsersSave: any = false;
  public companiesListModal: any = false;
  public companiesAddListModal: any = false;
  public companiesReplaceListModal: any = false;
  public userFreezeModal: any = false;
  public userRestoreModal: any = false;
  public userDeleteModal: any = false;
  public addTeamMembersModal: any = false;
  public userFreezeAlertModal: any = false;
  public numberOfSelected: any = 0;
  public lineInIndex: any = false;
  public checkAll: any = false;
  public officeCompanies: any = [];
  public selectedCompany: any;
  filteredCompanies: string[];
  // @ViewChild('scrollContainer') scrollContainer: ElementRef;
  // @ViewChild('autoFilter') autoFilterRef: AutoComplete;
  public companyFilesSortControl: FormControl = new FormControl({
    orderBy: 'firstName',
    order: 'DESC'
  });
  @ViewChild('scrollContainer') scrollContainer: ElementRef;

  public firstNameArr: any[];
  public filterTypesFirstName: any = null;

  public lastNameArr: any[];
  public filterTypesLastName: any = null;

  public privTypeArr: any[];
  public filterTypesPrivType: any = null;

  public otpDetArr: any[];
  public filterTypesOtpDet: any = null;

  public statusArr: any[];
  public filterTypesStatus: any = null;
  public paymentDescArr: any[];
  public filterTypesPaymentDesc: any = null;

  public currentPage: number = 0;
  public entryLimit: number = 50;
  @ViewChild('paginator') paginator: Paginator;

  public privTypeList: any = [
    { value: 'officeSuperAdmin', label: 'מנהל מערכת' },
    { value: 'officeAdmin', label: 'מנהל' },
    { value: 'regular', label: 'משתמש' }
  ];
  public privTypeListLowPer: any = [
    { value: 'officeAdmin', label: 'מנהל' },
    { value: 'regular', label: 'משתמש' }
  ];
  public teamList: any = [];

  public tooltipEditFile: any;
  @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;

  constructor(
    public userService: UserService,
    public settingsComponent: CustomersSettingsComponent,
    public sharedService: SharedService,
    private restCommonService: RestCommonService,
    public translate: TranslateService,
    public override sharedComponent: SharedComponent
  ) {
    super(sharedComponent);
    this.hasPermission = this.userService.appData.userDataAdmin.officePriv;
  }



  addTeamMembers() {
    console.log('addTeamMembers');
    this.addTeamMembersModal = [
      {
        firstNameInput: new FormControl(
          {
            value: null,
            disabled: false
          },
          {
            validators: [Validators.required],
            updateOn: 'blur'
          }
        ),
        lastNameInput: new FormControl(
          {
            value: null,
            disabled: false
          },
          {
            validators: [Validators.required],
            updateOn: 'blur'
          }
        ),
        cellPhoneInput: new FormControl(
          {
            value: null,
            disabled: false
          },
          {
            validators: [
              Validators.required,
              ValidatorsFactory.cellNumberValidatorIL
            ],
            updateOn: 'blur'
          }
        ),
        mailInput: new FormControl(
          {
            value: null,
            disabled: false
          },
          {
            validators: [Validators.required, ValidatorsFactory.emailExtended],
            asyncValidators: this.emailNotExistsValidator.bind(this),
            updateOn: 'blur'
          }
        ),
        privType: null
      }
    ];
  }

  deleteMember(i: number) {
    if (this.addTeamMembersModal.length > 1) {
      this.addTeamMembersModal.splice(i, 1);
    } else {
      this.addTeamMembersModal[0].firstNameInput.setValue(null);
      this.addTeamMembersModal[0].lastNameInput.setValue(null);
      this.addTeamMembersModal[0].cellPhoneInput.setValue(null);
      this.addTeamMembersModal[0].mailInput.setValue(null);
      this.addTeamMembersModal[0].privType = null;
    }
  }

  notValidFl() {
    if (
      this.addTeamMembersModal.some((fc) => {
        const valReq = {
          firstNameInput: fc['firstNameInput'].invalid,
          lastNameInput: fc['lastNameInput'].invalid,
          cellPhoneInput: fc['cellPhoneInput'].invalid,
          mailInput: fc['mailInput'].invalid,
          privType: !fc.privType
        };
        const someIsInvalid = Object.values(valReq).some((val) => val);
        console.log('----someIsInvalid----', someIsInvalid, valReq);
        return someIsInvalid;
      })
    ) {
      return true;
    }

    return false;
  }

  addNewTeamMembers() {
    this.addTeamMembersModal.push({
      firstNameInput: new FormControl(
        {
          value: null,
          disabled: false
        },
        {
          validators: [Validators.required],
          updateOn: 'blur'
        }
      ),
      lastNameInput: new FormControl(
        {
          value: null,
          disabled: false
        },
        {
          validators: [Validators.required],
          updateOn: 'blur'
        }
      ),
      cellPhoneInput: new FormControl(
        {
          value: null,
          disabled: false
        },
        {
          validators: [
            Validators.required,
            ValidatorsFactory.cellNumberValidatorIL
          ],
          updateOn: 'blur'
        }
      ),
      mailInput: new FormControl(
        {
          value: null,
          disabled: false
        },
        {
          validators: [Validators.required, ValidatorsFactory.emailExtended],
          asyncValidators: this.emailNotExistsValidator.bind(this),
          updateOn: 'blur'
        }
      ),
      privType: null
    });
  }

  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }

  ngOnInit(): void {
    if (this.hasPermission) {
      this.loader = true;
      // this.officeUsersSave = false;
      // this.officeCompanies = [];
      // this.officeUsers = false;
      if (Array.isArray(this.officeUsers) && this.officeUsers.length) {
        this.officeUsers.forEach((fd, idx) => {
          const newObj = {};
          for (const key of Object.keys(fd)) {
            if (!key.includes('Input')) {
              newObj[key] = fd[key];
            }
          }
          this.officeUsers[idx] = newObj;
        });
      }
      combineLatest(
[
  this.sharedService.getOfficeUsers({
    uuid: this.userService.appData.userDataAdmin.accountantOfficeId
  }),
  this.sharedService.getOfficeCompanies({
    uuid: this.userService.appData.userDataAdmin.accountantOfficeId
  })
]
      ).subscribe((resSub:any) => {
        const [officeUsers, officeCompanies] = resSub;
        // cellPhone: "0527073717"
        // companiesCount: 0
        // companyIds: []
        // firstName: "QA11"
        // freeze: false
        // lastLoginDate: 1613588500000
        // lastName: "בדיקהt"
        // mail: "newproject@bizibox.biz"
        // otpDet: null
        // privType: "officeSuperAdmin"
        // userId: "1eab11ef-6ad2-08ff-e

        // officeSuperAdmin --מנהל מערכת
        // officeAdmin --מנהל
        // regular --משתמש

        // this.officeUsersSave = [
        //     {
        //     'otpDet': null,
        //     'userId': '1eab11ef-6ad2-08ff-e053-650aa8c0f96d',
        //     'firstName': 'QA11',
        //     'lastName': 'בדיקהt',
        //     'cellPhone': '0527073717',
        //     'mail': 'newproject@bizibox.biz',
        //     'lastLoginDate': 1613588500000,
        //     'privType': 'officeSuperAdmin',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': ["23127d8f-4398-24b0-e053-650aa8c05c0f"]
        // }, {
        //     'otpDet': null,
        //     'userId': 'ba303c4e-7ed5-606c-e053-0b6519ace75f',
        //     'firstName': 'ZEMED',
        //     'lastName': 'KATZAVIM',
        //     'cellPhone': null,
        //     'mail': 'zemed@bizibox.biz',
        //     'lastLoginDate': 1612087387000,
        //     'privType': 'regular',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': []
        // }, {
        //     'otpDet': null,
        //     'userId': 'b3bdaad3-57e6-770e-e053-0b6519acea39',
        //     'firstName': 'idanium',
        //     'lastName': 'IU 119 (225)',
        //     'cellPhone': null,
        //     'mail': 'idanium@bizibox.biz',
        //     'lastLoginDate': 1613674031000,
        //     'privType': 'officeSuperAdmin',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': []
        // }, {
        //     'otpDet': null,
        //     'userId': 'b7ff5adc-16cc-3cdd-e053-0b6519ac6100',
        //     'firstName': 'kabalot',
        //     'lastName': 'mekubalot',
        //     'cellPhone': null,
        //     'mail': 'kabalot2@bizibox.biz',
        //     'lastLoginDate': 1609685547000,
        //     'privType': 'regular',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': []
        // }, {
        //     'otpDet': null,
        //     'userId': '716ad0f9-2146-4941-8015-4e3a445e3c21',
        //     'firstName': 'בדיקה',
        //     'lastName': 'זיו',
        //     'cellPhone': '0502586427',
        //     'mail': 'ziva7@bizibox.biz',
        //     'lastLoginDate': null,
        //     'privType': 'regular',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': ["2491dd10-2787-4bc9-e053-650aa8c08bdc"]
        // }, {
        //     'otpDet': null,
        //     'userId': 'ac5ecbdf-f3f0-48cf-ab0f-c1d74ca8019b',
        //     'firstName': 'זיו',
        //     'lastName': 'בדיקה',
        //     'cellPhone': '0502542541',
        //     'mail': 'ziva1@bizibox.biz',
        //     'lastLoginDate': 1611746727000,
        //     'privType': 'regular',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': []
        // }, {
        //     'otpDet': null,
        //     'userId': 'ab99b4f7-7a19-7bc4-e053-650019ac5339',
        //     'firstName': 'משרד',
        //     'lastName': '(ocr) אמינוב',
        //     'cellPhone': '0508666343',
        //     'mail': 'IsraelSquad@bizibox.biz',
        //     'lastLoginDate': 1610981439000,
        //     'privType': 'regular',
        //     'companiesCount': 0,
        //     'freeze': false,
        //     'companyIds': ["23127d8f-4398-24b0-e053-650aa8c05c0f", "2491dd10-2787-4bc9-e053-650aa8c08bdc"]
        // }];

        this.officeUsersSave = officeUsers ? officeUsers['body'] : officeUsers;

        if (
          Array.isArray(this.officeUsersSave) &&
          this.officeUsersSave.length
        ) {
          for (const fd of this.officeUsersSave) {
            // fd.otpDet = [{
            //     otpCell: '0523333333',
            //     websiteTargetTypeId: 12,
            //     companyName: 'khgj'
            // },{
            //     otpCell: '0523333333',
            //     websiteTargetTypeId: 10,
            //     companyName: 'k hjfdhtgfv jkhfhg jhkfhg hfdhgfv gfjhfvhj jkvjh hjgfhgj'
            // }, {
            //     otpCell: '0523333333',
            //     websiteTargetTypeId: 12,
            //     companyName: 'khgj'
            // }];

            fd.privTypeName = fd.privType
              ? fd.privType === 'officeSuperAdmin'
                ? 'מנהל מערכת'
                : fd.privType === 'officeAdmin'
                ? 'מנהל'
                : fd.privType === 'regular'
                ? 'משתמש'
                : null
              : null;
          }
        }

        const nullValues = this.officeUsersSave.filter(
          (fd) => !fd['firstName']
        );
        const realValuesFolders = this.officeUsersSave.filter(
          (fd) => fd['firstName']
        );
        const isHebrew = realValuesFolders
          .filter((it) =>
            /[\u0590-\u05FF]/.test(it['firstName'].toLowerCase().slice(0, 1))
          )
          .sort((a, b) =>
            a['firstName'].toLowerCase() > b['firstName'].toLowerCase() ? 1 : -1
          );
        const isEnglish = realValuesFolders
          .filter((it) =>
            /^[A-Za-z]+$/.test(it['firstName'].toLowerCase().slice(0, 1))
          )
          .sort((a, b) =>
            a['firstName'].toLowerCase() > b['firstName'].toLowerCase() ? 1 : -1
          );
        const isNumbers = realValuesFolders
          .filter((it) => /^[0-9]+$/.test(it['firstName']))
          .sort((a, b) => (a['firstName'] > b['firstName'] ? 1 : -1));
        const isOthers = realValuesFolders
          .filter(
            (it) =>
              !/^[A-Za-z]+$/.test(it['firstName'].toLowerCase().slice(0, 1)) &&
              !/^[0-9]+$/.test(it['firstName']) &&
              !/[\u0590-\u05FF]/.test(it['firstName'].slice(0, 1))
          )
          .sort((a, b) => (a['firstName'] > b['firstName'] ? 1 : -1));
        const officeUsersSave = isHebrew.concat(
          isEnglish,
          isNumbers,
          isOthers,
          nullValues
        );
        this.officeUsersSave = officeUsersSave;
        this.settingsComponent.officeUsersCount = this.officeUsersSave.filter(
          (it) => !it.freeze
        ).length;

        // companyHp: 515210607
        // companyId: "2b0e120d-5817-3db4-e053-650aa8c0abb7"
        // companyName: "ב.א.ל.ט.א. יבוא ושיווק בע''מ"
        // contacts: []
        // hasPrivs: true

        this.officeCompanies = officeCompanies
          ? officeCompanies['body']
          : officeCompanies;
        if (
          Array.isArray(this.officeCompanies) &&
          this.officeCompanies.length
        ) {
          for (const company of this.officeCompanies) {
            company.contactsListTootip = company.contacts.join('\n');
            company.selcetCompany = false;
          }
        }

        if (
          this.companiesReplaceListModal &&
          this.companiesReplaceListModal.oldUserId
        ) {
          this.companiesReplaceListModal.listSave = [];
          const row = this.officeUsersSave.find(
            (it) => it.userId === this.companiesReplaceListModal.oldUserId
          );
          this.openCompaniesReplaceListModal(row, row.companiesCount);
        }

        this.filtersAll();
      });
    }
  }

  private emailNotExistsValidator(
    fc: AbstractControl
  ): Observable<ValidationErrors | null> {
    if (fc && fc.dirty && fc.value) {
      return this.restCommonService.mailValidation(fc.value.toString()).pipe(
        map((response:any) => {
          const isExist = response ? response['body'] : response;
          // "exist": true,
          //     "freeze": true
          // return {'exist': true, 'freeze': true};
          // if(!isExist.exist){
          //     this.updateUserDetails(row, 'mail')
          // }

          if (
            this.addTeamMembersModal &&
            this.addTeamMembersModal.length &&
            fc.value
          ) {
            const isExistInAnotherRows = this.addTeamMembersModal.some(
              (it) => it.activeRow === false && it.mailInput.value === fc.value
            );
            if (isExistInAnotherRows) {
              isExist.exist = true;
            }
            this.addTeamMembersModal.forEach((it) => {
              it.activeRow = false;
            });
          }
          return isExist.exist ? isExist : null;
        })
      );
    }

    return of(null);
  }

  updateUserDetails(row: any, name: string) {
    row.activeRow = false;
    if (!row[name + 'Input'].value) {
      row[name + 'Input'].setValue(row[name]);
    } else {
      if (row[name + 'Input'].pending) {
        const subscription = row[name + 'Input'].statusChanges.subscribe(
          (status) => {
            console.log(status); //status will be "VALID", "INVALID", "PENDING" or "DISABLED"
            if (status !== 'PENDING') {
              subscription.unsubscribe();
            }
            if (status === 'VALID') {
              if (
                !row[name + 'Input'].invalid &&
                row[name] !== row[name + 'Input'].value
              ) {
                row[name] = row[name + 'Input'].value;
                const params = {
                  userId: row.userId,
                  firstName: row.firstName,
                  lastName: row.lastName,
                  cellPhone: row.cellPhone,
                  mail: row.mail,
                  accountantOfficeId:
                    this.userService.appData.userDataAdmin.accountantOfficeId
                };
                console.log('params', params);
                this.sharedService
                  .updateUserDetails(params)
                  .subscribe(() => {});
              }
            }
          }
        );
      } else {
        if (
          !row[name + 'Input'].invalid &&
          row[name] !== row[name + 'Input'].value &&
          !row[name + 'Input'].pending
        ) {
          row[name] = row[name + 'Input'].value;
          const params = {
            userId: row.userId,
            firstName: row.firstName,
            lastName: row.lastName,
            cellPhone: row.cellPhone,
            mail: row.mail,
            accountantOfficeId:
              this.userService.appData.userDataAdmin.accountantOfficeId
          };
          console.log('params', params);
          this.sharedService.updateUserDetails(params).subscribe(() => {});
        }
      }
    }
  }

  trackById(index: number, val: any): any {
    return val['userId'] + '_' + index;
  }

  filterCompanies(event) {
    console.log(event.query);
    // this.query = event.query;
    const filteredCompanies = this.officeCompanies.filter((it) => {
      return [it.companyName, it.companyHp]
        .filter((v) => (typeof v === 'string' || typeof v === 'number') && !!v)
        .some((vstr) => vstr.toString().includes(event.query));
    });
    if (filteredCompanies.length) {
      const notString = filteredCompanies.filter(
        (fd) => typeof fd['companyName'] !== 'string'
      );
      this.filteredCompanies = filteredCompanies
        .filter((fd) => typeof fd['companyName'] === 'string')
        .sort((a, b) => {
          const lblA = a['companyName'],
            lblB = b['companyName'];
          return (
            (lblA || lblB
              ? !lblA
                ? 1
                : !lblB
                ? -1
                : lblA.localeCompare(lblB)
              : 0) * 1
          );
        })
        .concat(notString);
    } else {
      this.filteredCompanies = filteredCompanies;
    }
  }

  clear() {
    this.filtersAll();
  }

  selectCompany() {
    console.log(this.selectedCompany);
    this.filtersAll();
  }

  private rebuildOtpDetMap(withOtherFiltersApplied: any[]): void {
    this.otpDetArr = [
      {
        val: this.translate.translations[this.translate.currentLang].filters
          .all,
        id: 'all',
        checked: true
      }
    ];
    if (withOtherFiltersApplied.some((item) => !item.otpDet)) {
      this.otpDetArr.push({
        val: 'ריקים',
        id: 'null',
        checked: true
      });
    }
    if (
      withOtherFiltersApplied.some(
        (dtRow) => dtRow.otpDet && dtRow.otpDet.length
      )
    ) {
      this.otpDetArr.push({
        val: 'מקבל OTP',
        id: 'true',
        checked: true
      });
    }

    console.log('this.otpDetArr => %o', this.otpDetArr);
  }

  private rebuildFirstNameMap(withOtherFiltersApplied: any[]): void {
    const firstNameArrMap: { [key: string]: any } =
      withOtherFiltersApplied.reduce(
        (acmltr, dtRow) => {
          if (
            dtRow.firstName !== undefined &&
            dtRow.firstName.toString() &&
            !acmltr[dtRow.firstName.toString()]
          ) {
            acmltr[dtRow.firstName.toString()] = {
              val: dtRow.firstName.toString(),
              id: dtRow.firstName.toString(),
              checked: true
            };

            if (
              acmltr['all'].checked &&
              !acmltr[dtRow.firstName.toString()].checked
            ) {
              acmltr['all'].checked = false;
            }
          }
          return acmltr;
        },
        {
          all: {
            val: this.translate.translations[this.translate.currentLang].filters
              .all,
            id: 'all',
            checked: true
          }
        }
      );
    this.firstNameArr = Object.values(firstNameArrMap);
    console.log('this.firstNameArr => %o', this.firstNameArr);
  }

  private rebuildLastNameMap(withOtherFiltersApplied: any[]): void {
    const lastNameArrMap: { [key: string]: any } =
      withOtherFiltersApplied.reduce(
        (acmltr, dtRow) => {
          if (
            dtRow.lastName !== undefined &&
            dtRow.lastName.toString() &&
            !acmltr[dtRow.lastName.toString()]
          ) {
            acmltr[dtRow.lastName.toString()] = {
              val: dtRow.lastName.toString(),
              id: dtRow.lastName.toString(),
              checked: true
            };

            if (
              acmltr['all'].checked &&
              !acmltr[dtRow.lastName.toString()].checked
            ) {
              acmltr['all'].checked = false;
            }
          }
          return acmltr;
        },
        {
          all: {
            val: this.translate.translations[this.translate.currentLang].filters
              .all,
            id: 'all',
            checked: true
          }
        }
      );
    this.lastNameArr = Object.values(lastNameArrMap);
    console.log('this.lastNameArr => %o', this.lastNameArr);
  }

  private rebuildPrivTypeMap(withOtherFiltersApplied: any[]): void {
    const privTypeArrMap: { [key: string]: any } =
      withOtherFiltersApplied.reduce(
        (acmltr, dtRow) => {
          if (
            dtRow.privType !== undefined &&
            dtRow.privType.toString() &&
            !acmltr[dtRow.privType.toString()]
          ) {
            acmltr[dtRow.privType.toString()] = {
              val: dtRow.privTypeName.toString(),
              id: dtRow.privType.toString(),
              checked: true
            };

            if (
              acmltr['all'].checked &&
              !acmltr[dtRow.privType.toString()].checked
            ) {
              acmltr['all'].checked = false;
            }
          }
          return acmltr;
        },
        {
          all: {
            val: this.translate.translations[this.translate.currentLang].filters
              .all,
            id: 'all',
            checked: true
          }
        }
      );
    this.privTypeArr = Object.values(privTypeArrMap);
    console.log('this.privTypeArr => %o', this.privTypeArr);
  }

  filtersAll(priority?: any, isSorted?: boolean): void {
    if (
      this.officeUsersSave &&
      Array.isArray(this.officeUsersSave) &&
      this.officeUsersSave.length
    ) {
      this.officeUsers = JSON.parse(JSON.stringify(this.officeUsersSave));
      if (this.officeUsers.length) {
        this.officeUsers = !this.selectedCompany
          ? this.officeUsers
          : (this.officeUsers = JSON.parse(
              JSON.stringify(this.officeUsersSave)
            ).filter(
              (row) =>
                row.companyIds &&
                row.companyIds.length &&
                row.companyIds.some(
                  (id) => id === this.selectedCompany.companyId
                )
            ));
      }

      // שם פרטי - הכל ורשימת שמות firstName
      // שם משפחה - הכל ורשימת שמות משפחה lastName
      // סוג משתמש - סינון (הכל, מנהל מערכת, מנהל, משתמש) privType privTypeName
      // (OTP הכל, ריקים, מקבל) סינון - OTP מקבל otpDet

      if (priority === 'firstName') {
        if (this.filterTypesFirstName && this.filterTypesFirstName.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.firstName !== undefined) {
              return this.filterTypesFirstName.some(
                (it) => it === item.firstName.toString()
              );
            }
          });
        } else if (
          this.filterTypesFirstName &&
          !this.filterTypesFirstName.length
        ) {
          this.officeUsers = [];
        }
      }
      if (priority === 'lastName') {
        if (this.filterTypesLastName && this.filterTypesLastName.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.lastName !== undefined) {
              return this.filterTypesLastName.some(
                (it) => it === item.lastName.toString()
              );
            }
          });
        } else if (
          this.filterTypesLastName &&
          !this.filterTypesLastName.length
        ) {
          this.officeUsers = [];
        }
      }
      if (priority === 'privType') {
        if (this.filterTypesPrivType && this.filterTypesPrivType.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.privType !== undefined) {
              return this.filterTypesPrivType.some(
                (it) => it === item.privType.toString()
              );
            }
          });
        } else if (
          this.filterTypesPrivType &&
          !this.filterTypesPrivType.length
        ) {
          this.officeUsers = [];
        }
      }
      if (priority === 'otpDet') {
        if (this.filterTypesOtpDet && this.filterTypesOtpDet.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (this.filterTypesOtpDet.some((it) => it === 'all')) {
              return item;
            } else {
              if (this.filterTypesOtpDet.some((it) => it === 'null')) {
                if (item.otpDet === null) {
                  return item;
                }
              }
              if (this.filterTypesOtpDet.some((it) => it === 'true')) {
                if (item.otpDet && item.otpDet.length) {
                  return item;
                }
              }
            }
          });
        } else if (this.filterTypesOtpDet && !this.filterTypesOtpDet.length) {
          this.officeUsers = [];
        }
      }

      if (!isSorted) {
        if (priority !== 'firstName') {
          this.rebuildFirstNameMap(this.officeUsers);
        }
        if (priority !== 'lastName') {
          this.rebuildLastNameMap(this.officeUsers);
        }
        if (priority !== 'privType') {
          this.rebuildPrivTypeMap(this.officeUsers);
        }
        if (priority !== 'otpDet') {
          this.rebuildOtpDetMap(this.officeUsers);
        }
      } else {
        if (this.filterTypesFirstName && this.filterTypesFirstName.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.firstName !== undefined) {
              return this.filterTypesFirstName.some(
                (it) => it === item.firstName.toString()
              );
            }
          });
        }
        if (this.filterTypesLastName && this.filterTypesLastName.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.lastName !== undefined) {
              return this.filterTypesLastName.some(
                (it) => it === item.lastName.toString()
              );
            }
          });
        }
        if (this.filterTypesPrivType && this.filterTypesPrivType.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (item.privType !== undefined) {
              return this.filterTypesPrivType.some(
                (it) => it === item.privType.toString()
              );
            }
          });
        }
        if (this.filterTypesOtpDet && this.filterTypesOtpDet.length) {
          this.officeUsers = this.officeUsers.filter((item) => {
            if (this.filterTypesOtpDet.some((it) => it === 'all')) {
              return item;
            } else {
              if (this.filterTypesOtpDet.some((it) => it === 'null')) {
                if (item.otpDet === null) {
                  return item;
                }
              }
              if (this.filterTypesOtpDet.some((it) => it === 'true')) {
                if (item.otpDet && item.otpDet.length) {
                  return item;
                }
              }
            }
          });
        }
      }

      if (this.officeUsers.length > 1) {
        switch (this.companyFilesSortControl.value.orderBy) {
          case 'lastLoginDate':
          case 'companiesCount':
            // noinspection DuplicatedCode
            const notNumber = this.officeUsers.filter(
              (fd) =>
                typeof fd[this.companyFilesSortControl.value.orderBy] !==
                'number'
            );
            this.officeUsers = this.officeUsers
              .filter(
                (fd) =>
                  typeof fd[this.companyFilesSortControl.value.orderBy] ===
                  'number'
              )
              .sort((a, b) => {
                const lblA = a[this.companyFilesSortControl.value.orderBy],
                  lblB = b[this.companyFilesSortControl.value.orderBy];
                return lblA || lblB
                  ? !lblA
                    ? 1
                    : !lblB
                    ? -1
                    : this.companyFilesSortControl.value.order === 'ASC'
                    ? lblA - lblB
                    : lblB - lblA
                  : 0;
              })
              .concat(notNumber);
            break;
        }
      }
    } else {
      this.officeUsers = [];
    }

    if (Array.isArray(this.officeUsers) && this.officeUsers.length) {
      for (const fd of this.officeUsers) {
        fd.firstNameInput = new FormControl(
          {
            value: fd.firstName,
            disabled: fd.freeze
          },
          {
            validators: [Validators.required],
            updateOn: 'blur'
          }
        );
        fd.lastNameInput = new FormControl(
          {
            value: fd.lastName,
            disabled: fd.freeze
          },
          {
            validators: [Validators.required],
            updateOn: 'blur'
          }
        );
        fd.cellPhoneInput = new FormControl(
          {
            value: fd.cellPhone,
            disabled: fd.freeze
          },
          {
            validators: [
              Validators.required,
              ValidatorsFactory.cellNumberValidatorIL
            ],
            updateOn: 'blur'
          }
        );
        fd.mailInput = new FormControl(
          {
            value: fd.mail,
            disabled: fd.freeze
          },
          {
            validators: [Validators.required, ValidatorsFactory.emailExtended],
            asyncValidators: this.emailNotExistsValidator.bind(this),
            updateOn: 'blur'
          }
        );
      }
    }

    this.loader = false;
    this.currentPage = 0;
    this.paginator.changePage(0);
  }

  toggleCompanyFilesOrderTo(field: any) {
    if (this.companyFilesSortControl.value.orderBy === field) {
      this.companyFilesSortControl.patchValue({
        orderBy: this.companyFilesSortControl.value.orderBy,
        order:
          this.companyFilesSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
      });
    } else {
      this.companyFilesSortControl.patchValue({
        orderBy: field,
        order: 'DESC'
      });
    }
    this.filtersAll(undefined, true);
  }

  filterCategory(type: any) {
    console.log('----------------type-------', type);
    if (type.type === 'firstName') {
      this.filterTypesFirstName = type.checked;
      this.filtersAll(type.type);
    } else if (type.type === 'lastName') {
      this.filterTypesLastName = type.checked;
      this.filtersAll(type.type);
    } else if (type.type === 'privType') {
      this.filterTypesPrivType = type.checked;
      this.filtersAll(type.type);
    } else if (type.type === 'otpDet') {
      this.filterTypesOtpDet = type.checked;
      this.filtersAll(type.type);
    }
  }

  paginate(event) {
    if (this.entryLimit !== +event.rows) {
      this.entryLimit = +event.rows;
    }

    if (this.currentPage !== +event.page) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
    this.currentPage = event.page;
  }

  clearFilter(dropdown: Dropdown): void {
    dropdown.resetFilter();
  }

  onScrollCubes(i?: number): void {
    this.tooltipEditRef['_results'].forEach((it, idx) => {
      if (i !== undefined && idx !== i) {
        it.hide();
      }
      if (i === undefined) {
        it.hide();
      }
    });
  }

  changeOfficePriv(row: any) {
    // console.log(row.privType)
    row.activeRow = false;
    row.privTypeName = this.privTypeList.find(
      (it) => it.value === row.privType
    ).label;
    this.sharedService
      .changeOfficePriv({
        accountantOfficeId:
          this.userService.appData.userDataAdmin.accountantOfficeId,
        privType: row.privType,
        userId: row.userId
      })
      .subscribe(() => {});
  }

  openCompaniesListModal(row: any) {
    this.checkAll = false;
    this.companiesListModal = {
      lastName: row.lastName,
      companyIds: row.companyIds,
      list: this.officeCompanies.filter((it) =>
        row.companyIds.some((id) => id === it.companyId)
      ),
      listSave: this.officeCompanies.filter((it) =>
        row.companyIds.some((id) => id === it.companyId)
      )
    };
  }

  openCompaniesAddListModal(row: any, companiesCount?: any) {
    this.checkAll = false;
    this.lineInIndex = false;
    let officeCompanies = JSON.parse(JSON.stringify(this.officeCompanies));
    this.numberOfSelected = 0;
    let edit = false;
    if (companiesCount) {
      edit = true;
      if (Array.isArray(officeCompanies) && officeCompanies.length) {
        for (const company of officeCompanies) {
          if (
            company.hasPrivs &&
            row.companyIds.some((id) => id === company.companyId)
          ) {
            company.selcetCompany = true;
          }
        }
        this.numberOfSelected = officeCompanies.filter(
          (it) => it.selcetCompany
        ).length;
        this.lineInIndex =
          officeCompanies.filter((it) => it.selcetCompany).length - 1;
        officeCompanies = officeCompanies
          .filter((it) => it.selcetCompany)
          .concat(officeCompanies.filter((it) => !it.selcetCompany));
      }
    }
    this.companiesAddListModal = {
      edit: edit,
      firstName: row.firstName,
      lastName: row.lastName,
      userId: row.userId,
      companyIds: row.companyIds,
      list: officeCompanies,
      listSave: officeCompanies,
      listSaveOriginal: JSON.parse(JSON.stringify(officeCompanies))
    };
  }

  theSameSelctedCompanies() {
    const listSave = this.companiesAddListModal.listSave
      .filter((it) => it.selcetCompany)
      .map((com) => com.companyId);
    const listSaveOriginal = this.companiesAddListModal.listSaveOriginal
      .filter((it) => it.selcetCompany)
      .map((com) => com.companyId);
    // console.log('listSave', listSave);
    // console.log('listSaveOriginal', listSaveOriginal);
    // console.log('isEQ', JSON.stringify(listSave) === JSON.stringify(listSaveOriginal));
    return JSON.stringify(listSave) === JSON.stringify(listSaveOriginal);
  }

  setCompanyPrivs() {
    const pararms = {
      companyIds: !this.numberOfSelected
        ? null
        : this.companiesAddListModal.listSave
            .filter((it) => it.selcetCompany)
            .map((com) => com.companyId),
      userId: this.companiesAddListModal.userId,
      accountantOfficeId:
        this.userService.appData.userDataAdmin.accountantOfficeId
    };
    this.loader = true;
    this.companiesAddListModal = false;
    this.sharedService.setCompanyPrivs(pararms).subscribe(() => {
      this.ngOnInit();
    });
  }

  openCompaniesReplaceListModal(row: any, companiesCount?: any) {
    this.loaderTableSwap = false;
    let officeCompanies = JSON.parse(JSON.stringify(this.officeCompanies));
    officeCompanies = officeCompanies.filter(
      (it) => row.companyIds && row.companyIds.some((id) => id === it.companyId)
    );

    this.numberOfSelected = 0;
    this.teamList = JSON.parse(JSON.stringify(this.officeUsersSave))
      .filter((it) => it.userId !== row.userId)
      .map((uid) => ({
        value: uid.userId,
        label: uid.firstName + ' ' + uid.lastName
      }));
    this.checkAll = false;
    if (companiesCount) {
      if (Array.isArray(officeCompanies) && officeCompanies.length) {
        for (const company of officeCompanies) {
          company.hasPrivs = false;
        }
      }
    }
    this.companiesReplaceListModal = {
      alreadyBelong: companiesCount
        ? officeCompanies.filter((it) => it.selcetCompany).length
        : 0,
      firstName: row.firstName,
      lastName: row.lastName,
      oldUserId: row.userId,
      newUserId: null,
      companyIds: row.companyIds,
      list: officeCompanies,
      listSave: officeCompanies
    };
  }

  companiesReplaceListModalChange(id: any) {
    let officeCompanies = JSON.parse(JSON.stringify(this.officeCompanies));
    officeCompanies = officeCompanies.filter((it) =>
      this.companiesReplaceListModal.companyIds.some(
        (ids) => ids === it.companyId
      )
    );
    const companyIds = this.officeUsersSave.find(
      (it) => it.userId === id.value
    ).companyIds;
    for (const company of officeCompanies) {
      if (companyIds && companyIds.some((ids) => ids === company.companyId)) {
        company.selcetCompany = true;
        company.hasPrivs = false;
      } else {
        if (!company.hasPrivs) {
          company.selcetCompany = false;
          company.hasPrivs = false;
        } else {
          company.selcetCompany = false;
          company.hasPrivs = true;
        }
      }
    }
    this.companiesReplaceListModal.listSave = officeCompanies;
    this.companiesReplaceListModal.list = officeCompanies;
    this.companiesReplaceListModal.alreadyBelong =
      this.companiesReplaceListModal.listSave.filter(
        (it) => it.selcetCompany && !it.hasPrivs
      ).length;
    this.numberOfSelected = 0;
    this.companiesReplaceListModal.list = JSON.parse(
      JSON.stringify(this.companiesReplaceListModal.listSave)
    );
  }

  companyPrivsSwap(isTheEnd?: any) {
    const pararms = {
      companyIds: this.companiesReplaceListModal.listSave
        .filter((it) => it.selcetCompany && it.hasPrivs)
        .map((com) => com.companyId),
      oldUserId: this.companiesReplaceListModal.oldUserId,
      newUserId: this.companiesReplaceListModal.newUserId,
      accountantOfficeId:
        this.userService.appData.userDataAdmin.accountantOfficeId
    };
    this.loader = true;
    this.loaderTableSwap = true;

    if (isTheEnd) {
      this.companiesReplaceListModal = false;
    }
    this.sharedService.companyPrivsSwap(pararms).subscribe(() => {
      this.ngOnInit();
    });
  }

  openUserFreezeModal(row: any) {
    this.userFreezeModal = {
      firstName: row.firstName,
      lastName: row.lastName,
      userId: row.userId,
      row: row
    };
  }

  userFreeze() {
    const pararms = {
      userId: this.userFreezeModal.userId,
      accountantOfficeId:
        this.userService.appData.userDataAdmin.accountantOfficeId
    };
    this.loader = true;
    const askPopupFreeze = this.userFreezeModal.row.companiesCount > 0;
    this.userFreezeModal = false;
    this.sharedService.userFreeze(pararms).subscribe(() => {
      if (askPopupFreeze) {
        this.sharedService.userFreezePopup(pararms).subscribe((res) => {
          this.ngOnInit();
          const response = res['body'];
          if (response === true) {
            this.userFreezeAlertModal = true;
          }
        });
      } else {
        this.ngOnInit();
      }
    });
  }

  openUserRestoreModal(row: any) {
    this.userRestoreModal = {
      firstName: row.firstName,
      lastName: row.lastName,
      userId: row.userId,
      row: row
    };
  }

  openUserDeleteModal(row: any) {
    this.userDeleteModal = {
      firstName: row.firstName,
      lastName: row.lastName,
      userId: row.userId,
      row: row
    };
  }

  officeUserDelete() {
    const pararms = {
      userId: this.userDeleteModal.userId,
      accountantOfficeId:
        this.userService.appData.userDataAdmin.accountantOfficeId
    };
    this.userDeleteModal = false;
    this.loader = true;
    this.userFreezeModal = false;
    this.sharedService.officeUserDelete(pararms).subscribe(
      () => {
        this.ngOnInit();
      },
      (err: HttpErrorResponse) => {
        if (err.error) {
          this.ngOnInit();

          console.log('An error occurred:', err.error.message);
        } else {
          console.log(
            `Backend returned code ${err.status}, body was: ${err.error}`
          );
        }
      }
    );
  }

  createNewOfficeUser() {
    const pararms = this.addTeamMembersModal.map((it) => {
      return {
        firstName: it.firstNameInput.value,
        lastName: it.lastNameInput.value,
        cellPhone: it.cellPhoneInput.value,
        mail: it.mailInput.value,
        accountantOfficeId:
          this.userService.appData.userDataAdmin.accountantOfficeId,
        privType: it.privType === 'regular' ? null : it.privType
      };
    });
    this.addTeamMembersModal = false;
    this.loader = true;
    this.sharedService
      .createNewOfficeUser({
        users: pararms
      })
      .subscribe(() => {
        this.ngOnInit();
      });
  }

  userRestore() {
    const pararms = {
      userId: this.userRestoreModal.userId,
      accountantOfficeId:
        this.userService.appData.userDataAdmin.accountantOfficeId
    };
    this.userRestoreModal = false;
    this.loader = true;
    this.userFreezeModal = false;
    this.sharedService.userRestore(pararms).subscribe(() => {
      this.ngOnInit();
    });
  }

  filterCompaniesModal(event) {
    console.log(event.target.value);

    const filteredCompanies = this.companiesListModal.listSave;

    if (event.target.value && event.target.value.length) {
      this.companiesListModal.list = filteredCompanies.filter((it) => {
        return [it.companyName, it.companyHp]
          .filter(
            (v) => (typeof v === 'string' || typeof v === 'number') && !!v
          )
          .some((vstr) => vstr.toString().includes(event.target.value));
      });
    } else {
      this.companiesListModal.list = filteredCompanies;
    }
  }

  filterCompaniesAddModal(event) {
    console.log(event.target.value);

    const filteredCompanies = this.companiesAddListModal.listSave;

    if (event.target.value && event.target.value.length) {
      this.companiesAddListModal.list = filteredCompanies.filter((it) => {
        return [it.companyName, it.companyHp]
          .concat(it.contacts)
          .filter(
            (v) => (typeof v === 'string' || typeof v === 'number') && !!v
          )
          .some((vstr) => vstr.toString().includes(event.target.value));
      });
    } else {
      this.companiesAddListModal.list = filteredCompanies;
    }
  }

  trackCompany(idx: number, item: any) {
    return (item ? item.companyId : null) || idx;
  }

  changeAll() {
    if (
      Array.isArray(this.companiesAddListModal.listSave) &&
      this.companiesAddListModal.listSave.length
    ) {
      for (const company of this.companiesAddListModal.listSave) {
        if (company.hasPrivs) {
          company.selcetCompany = this.checkAll;
        }
      }
      this.numberOfSelected = this.companiesAddListModal.listSave.filter(
        (it) => it.selcetCompany
      ).length;
    }
  }

  checkSelected(item: any) {
    this.companiesAddListModal.listSave.find(
      (it) => it.companyId === item.companyId
    ).selcetCompany = item.selcetCompany;
    this.numberOfSelected = this.companiesAddListModal.listSave.filter(
      (it) => it.selcetCompany
    ).length;
  }

  changeAllReplace() {
    if (
      Array.isArray(this.companiesReplaceListModal.listSave) &&
      this.companiesReplaceListModal.listSave.length
    ) {
      for (const company of this.companiesReplaceListModal.listSave) {
        if (company.hasPrivs) {
          company.selcetCompany = this.checkAll;
        }
      }
      this.numberOfSelected = this.companiesReplaceListModal.listSave.filter(
        (it) => it.selcetCompany && it.hasPrivs
      ).length;
    }
  }

  checkSelectedReplace(item: any) {
    this.companiesReplaceListModal.listSave.find(
      (it) => it.companyId === item.companyId
    ).selcetCompany = item.selcetCompany;
    this.numberOfSelected = this.companiesReplaceListModal.listSave.filter(
      (it) => it.selcetCompany && it.hasPrivs
    ).length;
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
