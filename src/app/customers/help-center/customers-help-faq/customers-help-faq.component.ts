import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CustomersHelpCenterComponent } from '../customers-help-center/customers-help-center.component';

@Component({
  selector: 'app-customers-help-faq',
  templateUrl: './customers-help-faq.component.html',
  encapsulation: ViewEncapsulation.None // ,
  // styleUrls: ['./customers-help-faq.component.scss']
})
export class CustomersHelpFaqComponent implements OnInit {
  constructor(
    public customersHelpCenterComponent: CustomersHelpCenterComponent
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit')
    // this.customersHelpCenterComponent.filteredQuestions$ = of([]); // this.customersHelpCenterComponent.faqList$;
    // this.customersHelpCenterComponent.filteredTerms$ = of([]);
  }
}
