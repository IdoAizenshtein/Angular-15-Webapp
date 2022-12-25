import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { TokenService } from '@app/core/token.service';
import { CustomersSettingsComponent } from '../customers-settings.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  merge
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReloadServices } from '@app/shared/services/reload.services';
import { publishRef } from '@app/shared/functions/publishRef';

@Component({
  templateUrl: './settings-alerts.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsAlertsComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  selectedCompanyAlertSettings$: Observable<CompanyAlertSettings>;
  readonly fcPushTimeToSend:any = new FormControl('', [Validators.required]);

  private readonly updateSubscribers: Subscription[] = [];
  private pushTimeToSendSubscriber: Subscription;

  readonly alertTimeRange: { min: Date; max: Date } = {
    min: new Date(1990, 0, 1, 6, 0),
    max: new Date(1990, 0, 1, 10, 30)
  };
  private readonly forceReload$ = new Subject<void>();
  private readonly destroyed$ = new Subject<void>();

  constructor(
    public userService: UserService,
    public override sharedComponent: SharedComponent,
    private sharedService: SharedService,
    public tokenService: TokenService,
    public settingsComponent: CustomersSettingsComponent,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super(sharedComponent);
  }
  override reload() {
    console.log('reload child');
    this.forceReload$.next();
  }
  ngOnInit(): void {
    this.selectedCompanyAlertSettings$ = merge(
      this.settingsComponent.selectedCompany$,
      this.forceReload$.pipe(
        switchMap(() => this.settingsComponent.selectedCompany$)
      )
    ).pipe(
      takeUntil(this.destroyed$),
      filter((val) => val !== null && val.companyId),
      tap(() => {
        this.loading$.next(true);
        this.updateSubscribers.forEach((sbs) => sbs.unsubscribe());
        this.updateSubscribers.length = 0;
      }),
      switchMap((val) =>
        this.sharedService.getMessagesSettingsForCompany(val.companyId)
      ),
      map((result:any) => (result && !result.error ? result.body : {})),
      tap((rslt: CompanyAlertSettings) => {
        this.loading$.next(false);
        if (!rslt) {
          this.fcPushTimeToSend.setValue('');
          return;
        }

        // rslt.pushTimeToSend = rslt.pushTimeToSend || 8.5;

        const hourPart = Math.trunc(rslt.pushTimeToSend);
        this.fcPushTimeToSend.setValue(
          new Date(
            1990,
            0,
            1,
            hourPart,
            rslt.pushTimeToSend > hourPart ? 30 : 0
          ),
          {
            emitEvent: false
          }
        );

        if (rslt.list) {
          rslt.list.forEach((mtc) => {
            if (mtc.messages) {
              mtc.form = new FormGroup(
                mtc.messages.reduce((acmltr, mts) => {
                  acmltr[mts.messageTypeId] = new FormControl(mts.push, []);
                  return acmltr;
                }, {})
              );

              this.updateSubscribers.push(
                mtc.form.valueChanges
                  .pipe(
                    distinctUntilChanged(),
                    withLatestFrom(this.settingsComponent.selectedCompany$),
                    switchMap(([val, selectedCompany]) => {
                      const data = mtc.messages
                        .filter(
                          (mts) =>
                            mts.messageTypeId in val &&
                            val[mts.messageTypeId] !== mts.push
                        )
                        .map((mts) => {
                          return {
                            enabled: mts.enabled,
                            messageTypeId: mts.messageTypeId,
                            push: val[mts.messageTypeId]
                          };
                        });
                      // console.log('data', data, val, mtc.messages)
                      return this.sharedService.updateMessagesSettings(
                        data,
                        selectedCompany.companyId
                      );
                    })
                  )
                  .subscribe((updateResult:any) => {
                    if (updateResult && !updateResult.error) {
                      mtc.messages
                        .filter((mts) => mts.messageTypeId in mtc.form.value)
                        .forEach(
                          (mts) =>
                            (mts.push = mtc.form.value[mts.messageTypeId])
                        );
                    }
                  })
              );
            }
          });
        }
      }),
      publishRef
    );

    this.pushTimeToSendSubscriber = this.fcPushTimeToSend.valueChanges
      .pipe(
        filter((val) => val !== null),
        debounceTime(1000),
        distinctUntilChanged(),
        map((val) => {
          const valForUpdate =
            val instanceof Date
              ? val.getHours() + (val.getMinutes() > 0 ? 0.5 : 0)
              : null;
          return valForUpdate;
        }),
        switchMap((val:any) =>
          this.sharedService.updateMessagesTimeToSendSettings(val)
        ),
        withLatestFrom(this.selectedCompanyAlertSettings$)
      )
      .subscribe(([rslt, selectedCompanyAlertSettings]) => {
        if (rslt && !rslt.error) {
          const valForUpdate =
            this.fcPushTimeToSend.value instanceof Date
              ? this.fcPushTimeToSend.value.getHours() +
                (this.fcPushTimeToSend.value.getMinutes() > 0 ? 0.5 : 0)
              : null;
          if (valForUpdate !== null) {
            selectedCompanyAlertSettings.pushTimeToSend = valForUpdate;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.updateSubscribers.forEach((sbs) => sbs.unsubscribe());
    this.updateSubscribers.length = 0;

    if (this.pushTimeToSendSubscriber) {
      this.pushTimeToSendSubscriber.unsubscribe();
    }
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }

  markAllIn(msgCat: MessageTypeCategory) {
    if (msgCat.form) {
      this.setBooleanInAllControlsTo(msgCat.form, true);
    }
  }

  unmarkAllIn(msgCat: MessageTypeCategory) {
    if (msgCat.form) {
      this.setBooleanInAllControlsTo(msgCat.form, false);
    }
  }

  private setBooleanInAllControlsTo(fg: any, val: boolean) {
    fg.setValue(
      Object.keys(fg.controls).reduce((acmltr, key) => {
        acmltr[key] = val;
        return acmltr;
      }, {})
    );
  }

  messageTypeCategoryTrack(idx: number, mtc: MessageTypeCategory) {
    return mtc.messageTypeCatId;
  }

  messageTypeTrack(idx: number,mts: MessageTypeSettings) {
    return mts.messageTypeId;
  }

  resetAlertSettingsToDefault() {
    this.settingsComponent.selectedCompany$
      .pipe(
        filter((val) => val !== null),
        switchMap((val) =>
          this.sharedService.resetMessagesSettingsForCompany(val.companyId)
        ),
        take(1)
      )
      .subscribe((rslt:any) => {
        if (rslt && !rslt.error) {
          this.forceReload$.next();
        }
      });
  }
}

export class CompanyAlertSettings {
  list: Array<MessageTypeCategory>;
  pushTimeToSend: number;
}

export class MessageTypeCategory {
  messageTypeCatId: string;
  messageTypeCatName: string;
  messages: Array<MessageTypeSettings>;
  form?: any;
}

export class MessageTypeSettings {
  alert: number;
  enabled: boolean;
  mail: boolean;
  messageTypeId: string;
  messageTypeName: string;
  push: boolean;
}
