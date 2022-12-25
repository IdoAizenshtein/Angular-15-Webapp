import { Pipe, PipeTransform } from '@angular/core';
import { AccountantSectionModel, SectionModel } from './section.model';

@Pipe({
  name: 'sectionIconSrc'
})
export class SectionIconSrcPipe implements PipeTransform {
  transform(value: string, args?: any): any {
    if (
      value === AccountantSectionModel[AccountantSectionModel.biziboxInvioce]
    ) {
      value = SectionModel[SectionModel.bankmatch];
    } else if (
      value === AccountantSectionModel[AccountantSectionModel.hashInvoice]
    ) {
      value = SectionModel[SectionModel.overview];
    }
    return '/assets/images/view-' + value + '.png';
  }
}
