import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersHelpCenterComponent } from './customers-help-center/customers-help-center.component';
import { CustomerHelpVideoComponent } from './customer-help-video/customer-help-video.component';
import { CustomerHelpBySectionComponent } from './customer-help-by-section/customer-help-by-section.component';
import { CustomersHelpFaqComponent } from './customers-help-faq/customers-help-faq.component';
import { CustomersHelpTermComponent } from './customers-help-term/customers-help-term.component';

const routes: Routes = [
  {
    path: '',
    component: CustomersHelpCenterComponent,
    children: [
      {
        path: 'video',
        component: CustomerHelpVideoComponent
      },
      {
        path: 'faq',
        component: CustomersHelpFaqComponent
      },
      {
        path: 'term',
        component: CustomersHelpTermComponent
      },
      {
        path: ':section',
        component: CustomerHelpBySectionComponent
      }
    ]
    // children: Object.values(SectionModel)
    //     .filter(k => isNaN(k))
    //     .map(k => {
    //         let component;
    //         switch (k) {
    //             case 'video':
    //                 component = CustomerHelpVideoComponent;
    //                 break;
    //             case 'faq':
    //                 component = CustomersHelpFaqComponent;
    //                 break;
    //         }
    //         // debugger;
    //         return !!component
    //             ? {
    //                 path: k,
    //                 component: component
    //             }
    //             : {
    //                 path: k
    //             };
    //         // return {
    //         //     path: k,
    //         //     component: CustomersHelpCenterComponent
    //         // };
    //     })
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpCenterRoutingModule {}
