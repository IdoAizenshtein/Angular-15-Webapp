import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChange,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { UserService } from '@app/core/user.service';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import { StorageService } from '@app/shared/services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TransTypesService } from '@app/core/transTypes.service';
import { ReloadServices } from '@app/shared/services/reload.services';

@Component({
  selector: 'app-checks-addition',
  templateUrl: './checks-addition.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class ChecksAdditionComponent
  extends ReloadServices
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() visible: boolean;
  @Input() form: any;

  @Input() accounts: any[];
  @Input() paymentTypes: any[];
  @Input() allowPaymentTypeChange = true;
  @Input() typeId: number;

  cheques: FormArray = new FormArray([]);

  companyTransTypes: any[] = [];
  defaultTransType: any;
  private subscription: Subscription;

  @ViewChild('checkNumberOrReferenceColumn', { read: ElementRef })
  checkNumberOrReferenceColumn: ElementRef;
  @ViewChild('checkNumberGuideOvP', { read: OverlayPanel })
  checkNumberGuideOvP: OverlayPanel;
  readonly checkNumberGuides: { stopIt: boolean };
  @ViewChildren('totalFields', { read: ElementRef })
  paymentCreateTotalsRef: QueryList<ElementRef>;

  public readonly today: Date = new Date();
  public readonly calendarMax: Date = new Date(
    new Date().setFullYear(new Date().getFullYear() + 2)
  );

  asmachtaVsExistingChecksMap: { [key: string]: any[] } = Object.create(null);
  private readonly destroyed$ = new Subject<void>();

  constructor(
    public userService: UserService,
    private translate: TranslateService,
    private fb: FormBuilder,
    public override sharedComponent: SharedComponent,
    private sharedService: SharedService,
    private storageService: StorageService,
    private transTypesService: TransTypesService
  ) {
    super(sharedComponent);

    this.checkNumberGuides = {
      stopIt:
        this.storageService.localStorageGetterItem(
          'checkNumberGuides.display'
        ) === 'false'
    };

    this.paymentTypes = ['Checks', 'BankTransfer', 'Other'].map((val) => {
      return {
        label: this.translate.instant('paymentTypes.' + val),
        value: val
      };
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }
  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }
  ngOnInit(): void {
    this.subscription = this.transTypesService.selectedCompanyTransTypes
      .pipe(takeUntil(this.destroyed$))
      .subscribe((rslt) => this.onCategoriesArrive(rslt));

    // if (this.userService.appData.userData.companies) {
    //     this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId)
    //         .subscribe(rslt => this.onCategoriesArrive(rslt));
    // } else {
    //     this.subscription = this.sharedComponent.getDataEvent
    //         .pipe(
    //             switchMap(() => {
    //                 return this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId);
    //             }))
    //         .subscribe(rslt => this.onCategoriesArrive(rslt));
    // }
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes['form']) {
      this.populateForm();
    }
  }

  ngAfterViewInit(): void {
    if (
      this.form.get('paymentType').value === 'Checks' &&
      !this.checkNumberGuides.stopIt
    ) {
      requestAnimationFrame(() => {
        this.checkNumberGuideOvP.show(
          new Event('dummy'),
          this.checkNumberOrReferenceColumn.nativeElement
        );
      });
    }
  }

  reset() {
    while (this.cheques.length > 0) {
      this.cheques.removeAt(0);
      this.cheques.updateValueAndValidity();
    }
    this.addPayments(true);

    this.asmachtaVsExistingChecksMap = Object.create(null);
  }

  private onCategoriesArrive(rslt: any) {
    // debugger;
    this.companyTransTypes = rslt;
    this.defaultTransType = this.companyTransTypes.find(
      (id) => id.transTypeId === 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
    );
    if (this.cheques.length) {
      this.cheques.controls
        .filter((row) => !row.get('transType').value)
        .forEach((row) => row.get('transType').setValue(this.defaultTransType));
    }
  }

  private populateForm(): void {
    if (this.form) {
      // debugger;
      if (!this.form.contains('account')) {
        this.form.addControl(
          'account',
          this.fb.control(null, [Validators.required])
        );
      }

      if (!this.form.contains('ddMutav')) {
        this.form.addControl('ddMutav', this.fb.control(''));
      }

      if (!this.form.contains('paymentType')) {
        this.form.addControl(
          'paymentType',
          this.fb.control(this.paymentTypes[0].value, [Validators.required])
        );
      }

      if (!this.form.contains('cheques')) {
        this.form.addControl('cheques', this.cheques);
      }

      if (this.cheques.length === 0) {
        this.addPayments();
      }
    }
  }

  addPayments(transferFocus?: boolean) {
    let dateNext: Date = null;
    let asmachta: number = null;
    let total: number = null;
    let paymentDesc: string = null;
    let transType: any = this.defaultTransType;

    const lastRow = this.cheques.value[this.cheques.value.length - 1];
    if (lastRow) {
      if (lastRow.dueDate) {
        dateNext = new Date(lastRow.dueDate);
        // dateNext.setMonth(dateNext.getMonth() + 1);
        if (
          dateNext.getDate() ===
          new Date(dateNext.getFullYear(), dateNext.getMonth() + 1, 0).getDate()
        ) {
          dateNext = this.userService.appData
            .moment(dateNext)
            .add(1, 'months')
            .endOf('month')
            .toDate();
        } else {
          dateNext = this.userService.appData
            .moment(dateNext)
            .add(1, 'months')
            .toDate();
        }
      }

      if (
        this.form.get('paymentType').value === 'Checks' &&
        lastRow.asmachta !== ''
      ) {
        asmachta = Number(lastRow.asmachta) + 1;
      }

      paymentDesc = lastRow.paymentDesc;
      transType = lastRow.transType;
      total = lastRow.total;
    }

    const newRow = {
      dueDate: dateNext,
      asmachta: asmachta,
      transType: transType,
      total: total,
      paymentDesc: paymentDesc
    };

    const newGroup = this.fb.group(newRow);
    newGroup
      .get('asmachta')
      .valueChanges.pipe(
        filter(
          (val:any) =>
            ((val && val.length) ||
              (this.form.get('ddMutav').value &&
                this.form.get('ddMutav').value !== '' &&
                this.form.get('ddMutav').value.biziboxMutavId) ||
              (Number(newGroup.get('total').value) !== 0 &&
                newGroup.get('dueDate').value)) &&
            this.form.get('account').value &&
            this.form.get('paymentType').value === 'Checks' &&
            !(val in this.asmachtaVsExistingChecksMap)
        ),
        switchMap((val) => {
          return this.sharedService
            .existingCheck({
              companyAccountId: this.form.get('account').value.companyAccountId,
              chequeNo: val && val.toString().length >= 4 ? Number(val) : null,
              companyId:
                this.userService.appData.userData.companySelect.companyId,
              total: newGroup.get('total').value
                ? Number(newGroup.get('total').value)
                : null,
              biziboxMutavId:
                this.form.get('ddMutav').value &&
                this.form.get('ddMutav').value !== '' &&
                this.form.get('ddMutav').value.biziboxMutavId
                  ? this.form.get('ddMutav').value.biziboxMutavId
                  : null,
              accountMutavName:
                this.form.get('ddMutav').value &&
                this.form.get('ddMutav').value !== '' &&
                this.form.get('ddMutav').value.accountMutavName
                  ? this.form.get('ddMutav').value.accountMutavName
                  : null,
              expense: this.typeId === 44,
              dueDate: newGroup.get('dueDate').value
                ? newGroup.get('dueDate').value.toISOString()
                : null
            })
            .pipe(
              map((response:any) => {
                const existingChecks = response ? response['body'] : response;
                return {
                  asmachta: val,
                  existingChecks: Array.isArray(existingChecks)
                    ? existingChecks
                    : null
                };
              })
            );
        })
      )
      .subscribe(
        (response:any) => {
          this.asmachtaVsExistingChecksMap[response.asmachta] =
            response.existingChecks;
          // if (Array.isArray(response.existingChecks)) {
          //     this.cheques.value.forEach((item, idx) => {
          //         if (item.asmachta === response.asmachta) {
          //             this.cheques.value[idx].isCheckExist = response.existingChecks[0];
          //         }
          //     });
          // } else {
          //     this.cheques.value.forEach((item, idx) => {
          //         if (item.asmachta === response.asmachta && item.isCheckExist) {
          //             this.cheques.value[idx].isCheckExist = undefined;
          //         }
          //     });
          // }
        },
        (err: HttpErrorResponse) => {
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );

    newGroup
      .get('total')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.asmachtaVsExistingChecksMap = Object.create(null);
        newGroup.get('asmachta').setValue(newGroup.get('asmachta').value);
      });
    newGroup
      .get('dueDate')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.asmachtaVsExistingChecksMap = Object.create(null);
        newGroup.get('asmachta').setValue(newGroup.get('asmachta').value);
      });
    this.form
      .get('ddMutav')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.asmachtaVsExistingChecksMap = Object.create(null);
        newGroup.get('asmachta').setValue(newGroup.get('asmachta').value);
      });
    this.form
      .get('account')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.asmachtaVsExistingChecksMap = Object.create(null);
        newGroup.get('asmachta').setValue(newGroup.get('asmachta').value);
      });

    this.cheques.push(newGroup);

    if (transferFocus === true) {
      requestAnimationFrame(() => {
        this.paymentCreateTotalsRef.last.nativeElement.focus();
      });
    }

    requestAnimationFrame(() => {
      this.paymentCreateTotalsRef.last.nativeElement.scrollIntoView();
    });
  }

  removeItem(index: number) {
    this.cheques.removeAt(index);
    this.cheques.updateValueAndValidity();
  }

  onCheckNumberGuideHide(): void {
    if (this.checkNumberGuides.stopIt) {
      this.storageService.localStorageSetter(
        'checkNumberGuides.display',
        'false'
      );
    }
  }
}
