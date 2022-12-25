import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { CustomersSettingsComponent } from '../customers-settings.component';
import {
  filter,
  map,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component';
import { ReloadServices } from '@app/shared/services/reload.services';
import { publishRef } from '@app/shared/functions/publishRef';

@Component({
  templateUrl: './settings-users.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SettingsUsersComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  private readonly destroyed$ = new Subject<void>();
  readonly forceReload$ = new Subject<void>();
  readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  selectedCompanyUsers$: Observable<Array<CompanyUser>>;

  readonly userAddedPrompt: {
    visible: boolean;
    firstName: string;
    lastName: string;
  };

  constructor(
    public settingsComponent: CustomersSettingsComponent,
    public userService: UserService,
    public override sharedComponent: SharedComponent,
    private sharedService: SharedService
  ) {
    super(sharedComponent);

    this.userAddedPrompt = {
      firstName: null,
      lastName: null,
      visible: false
    };
  }
  override reload() {
    console.log('reload child');
    this.forceReload$.next();
  }
  ngOnInit(): void {
    this.selectedCompanyUsers$ = merge(
      this.settingsComponent.selectedCompany$,
      this.forceReload$.pipe(
        switchMap(() => this.settingsComponent.selectedCompany$)
      )
    ).pipe(
      takeUntil(this.destroyed$),
      withLatestFrom(
        this.settingsComponent.isUsersTabAvailableForSelectedCompany$
      ),
      filter(([selectedCompany, isUsersTabAvailableForSelectedCompany]) => {
        return (
          (isUsersTabAvailableForSelectedCompany ||
            (this.userService.appData && this.userService.appData.isAdmin)) &&
          selectedCompany !== null
        );
      }),
      tap(() => this.loading$.next(true)),
      switchMap(([selectedCompany]) => {
        return this.sharedService.getUsersForCompany(selectedCompany.companyId);
      }),
      tap(
        () => this.loading$.next(false)
      ),
      map((response:any) => (!response || response.error ? null : response.body)),
      // shareReplay(1),
      publishRef
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }

  showUserAddedPrompt(firstName: string, lastName: string): void {
    this.userAddedPrompt.firstName = firstName;
    this.userAddedPrompt.lastName = lastName;
    this.userAddedPrompt.visible = true;
  }
}

export class CompanyUser {
  accountNicknameList: string[];
  cellPhone: string;
  dataAccess: 'KSAFIM' | 'ANHALATHESHBONOT' | 'ALL';
  firstName: string;
  lastName: string;
  userId: string;
  userLastLogin: number;
  userMail: string;
  userPrivType:
    | 'KSAFIM'
    | 'ANHALATHESHBONOT'
    | 'COMPANYADMIN'
    | 'COMPANYSUPERADMIN'
    | 'REGULAR';
}
