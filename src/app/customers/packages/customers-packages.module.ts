import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersPackagesComponent } from './customers-packages.component';
import { CustomersPackagesRoutingModule } from './customers-packages-routing.module';

@NgModule({
  imports: [CommonModule, CustomersPackagesRoutingModule, SharedModule],
  declarations: [CustomersPackagesComponent]
})
export class CustomersPackagesModule {}
