import { Pipe, PipeTransform } from '@angular/core';
// import {Searchable} from '@app/shared/component/knowledge-base/help-center.service';
import { QuestionData, Searchable, TermData } from './searchable.model';

@Pipe({
  name: 'filterSearchables'
})
export class FilterSearchablesPipe implements PipeTransform {
  // transform(value: Array<T extends Searchable>, args?: any): any {
  //   return null;
  // }
  transform<T extends Searchable>(list: Array<T>, query: string): Array<T> {
    if (!Array.isArray(list)) {
      return [];
    }

    const wordsToSearch = !query ? [] : this.splitToWords(query);
    if (!Array.isArray(wordsToSearch) || !wordsToSearch.length) {
      return list;
    }

    const filtered = list.filter((searchable) => {
      let textToSearch;
      if (searchable instanceof TermData || (<any>searchable).subject) {
        textToSearch = (<any>searchable).subject;
      } else if (
        searchable instanceof QuestionData ||
        (<any>searchable).question
      ) {
        textToSearch = (<any>searchable).question;
      }

      const containedTextually =
        !!textToSearch &&
        wordsToSearch.every((wrd) => textToSearch.includes(wrd));
      //   const containedTextually = !!textToSearch && textToSearch.includes(query);
      // const containedTextually = this.splitToWords(textToSearch)
      //     .some(txtWrd => wordsToSearch.some(wrd => txtWrd.includes(wrd)));

      return (
        containedTextually ||
        searchable.keywords.some((kw) => {
          return wordsToSearch.some((wrd) => kw.keyword.includes(wrd));
        })
      );
    });

    return filtered;
  }

  private splitToWords(val: string): Array<string> {
    return !val
      ? []
      : val
          .split(' ')
          .map((part) => part.trim())
          .filter((part) => part);
  }
}
