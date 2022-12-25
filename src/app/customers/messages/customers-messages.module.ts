import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersMessagesComponent } from './customers-messages.component';
import { CustomersMessagesRoutingModule } from './customers-messages-routing.module';

@NgModule({
  imports: [CommonModule, CustomersMessagesRoutingModule, SharedModule],
  declarations: [CustomersMessagesComponent]
})
export class CustomersMessagesModule {}
