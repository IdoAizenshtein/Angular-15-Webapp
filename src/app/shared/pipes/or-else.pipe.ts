import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orElsePipe'
})
export class OrElsePipe implements PipeTransform {

  transform(value: unknown, dflt = 'אין מידע'): string {
    return !!value ? String(value) : dflt;
  }
}
