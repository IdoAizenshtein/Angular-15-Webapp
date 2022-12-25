import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CustomersHelpCenterComponent } from '../customers-help-center/customers-help-center.component';

@Component({
  selector: 'app-customers-help-term',
  templateUrl: './customers-help-term.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class CustomersHelpTermComponent implements OnInit {
  constructor(
    public customersHelpCenterComponent: CustomersHelpCenterComponent
  ) {}

  ngOnInit() {
    console.log('ngOnInit')
  }
}
