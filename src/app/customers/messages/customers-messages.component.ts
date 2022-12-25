import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, startWith, switchMap } from 'rxjs/operators';
import { Message, MessagesService } from '@app/core/messages.service';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {
  Location,
  LocationStrategy,
  PathLocationStrategy
} from '@angular/common';
import { publishRef } from '@app/shared/functions/publishRef';

@Component({
  providers: [
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy }
  ],
  templateUrl: './customers-messages.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersMessagesComponent implements OnInit {
  selectedCompanyFullMessages$: Observable<Array<Message>>;

  constructor(
    public location: Location,
    public userService: UserService,
    public sharedComponent: SharedComponent,
    private messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.selectedCompanyFullMessages$ = this.sharedComponent.getDataEvent.pipe(
      startWith(true),
      filter(
        () =>
          this.userService.appData &&
          this.userService.appData.userData &&
          this.userService.appData.userData.companySelect
      ),
      switchMap(() =>
        this.messagesService.getCompanyMessages({
          companyAccountIds: [],
          companyId: this.userService.appData.userData.companySelect.companyId,
          source: 'page'
        })
      ),
      publishRef
    );
  }
}
