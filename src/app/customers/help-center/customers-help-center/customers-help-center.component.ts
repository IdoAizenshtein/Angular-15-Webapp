import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AccountantSectionModel, SectionModel } from '../shared/section.model';
import { SharedComponent } from '@app/shared/component/shared.component'; // import {sharedComponent} from '@app/customers.component';
import { UserService } from '@app/core/user.service';
import { HelpCenterService } from '../help-center.service';
import {
  QuestionData,
  Searchable,
  TermData,
  VideoData
} from '../shared/searchable.model';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import {Searchable, TermData} from '@app/shared/component/knowledge-base/help-center.service';
import { MatLegacyOptionSelectionChange as MatOptionSelectionChange } from '@angular/material/legacy-core';
import { FilterSearchablesPipe } from '../shared/filter-searchables.pipe';
import { of } from 'rxjs/internal/observable/of';

@Component({
  selector: 'app-customers-help-center',
  templateUrl: './customers-help-center.component.html',
  encapsulation: ViewEncapsulation.None
})
export class CustomersHelpCenterComponent implements  OnDestroy {
  readonly searchFC = new FormControl('');

  readonly sectionsList;

  readonly faqList$: Observable<Array<QuestionData>>;
  readonly responsesParsed: { [k: string]: SafeHtml } = {};

  readonly termsList$: Observable<Array<TermData>>;

  private searchExpression$: Observable<string>; // Observable<Array<string>>;

  // private _filteredQuestions$: Observable<Array<QuestionData>>;
  // get filteredQuestions$() {
  //     return this._filteredQuestions$;
  // }
  // set filteredQuestions$(val) {
  //     this._filteredQuestions$ = !val ? val
  //         : zip(
  //             this.searchExpression$,
  //             val
  //         )
  //             .pipe(
  //                 map(([search, questions]) =>
  //                     this.filterSearchablesPipe.transform(questions, search))
  //             );
  // }
  //
  // private _filteredTerms$: Observable<Array<TermData>>;
  // get filteredTerms$() {
  //     return this._filteredTerms$;
  // }
  // set filteredTerms$(val) {
  //     this._filteredTerms$ = !val ? val
  //         : zip(
  //             this.searchExpression$,
  //             val
  //         )
  //             .pipe(
  //                 map(([search, terms]) =>
  //                     this.filterSearchablesPipe.transform(terms, search))
  //             );
  // }

  readonly selectedCompanyTypeChange: Observable<any>;
  readonly videosList$: Observable<Array<VideoData>>;

  private readonly destroyed$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  constructor(
    public sharedComponent: SharedComponent,
    public userService: UserService,
    private helpCenterService: HelpCenterService,
    private route: ActivatedRoute,
    private router: Router,
    private _sanitizer: DomSanitizer,
    private filterSearchablesPipe: FilterSearchablesPipe,
    private activatedRoute: ActivatedRoute
  ) {
    this.sectionsList = Object.values(
      this.userService.appData.userData.accountant
        ? AccountantSectionModel
        : SectionModel
    ).filter((k) => isNaN(k));
    this.selectedCompanyTypeChange = this.userService.appData.userData.accountant
      ? of(true)
      : this.sharedComponent.getDataEvent.pipe(
          startWith(true),
          filter(
            () =>
              this.userService.appData &&
              this.userService.appData.userData &&
              this.userService.appData.userData.companySelect &&
              this.userService.appData.userData.companySelect.biziboxType
          ),
          map(
            () => this.userService.appData.userData.companySelect.biziboxType
          ),
          distinctUntilChanged()
        );

    this.faqList$ = this.selectedCompanyTypeChange.pipe(
      switchMap(() => this.helpCenterService.requestFAQList()),
      map((response:any) => (!response.error ? response.body : null)),
      tap((questions) => {
        if (Array.isArray(questions)) {
          questions.forEach((question: QuestionData, idx) => {
            question.questionId = String(idx);
          });
        }
      }),
      shareReplay(1),
      // publishReplay(1),
      // refCount(),
      takeUntil(this.destroyed$)
    );

    this.termsList$ = this.selectedCompanyTypeChange.pipe(
      switchMap(() => this.helpCenterService.requestTermList()),
      map((response:any) => (!response.error ? response.body : null)),
      shareReplay(1),
      // publishReplay(1),
      // refCount(),
      takeUntil(this.destroyed$)
    );

    this.searchExpression$ = this.searchFC.valueChanges.pipe(
      startWith(this.searchFC.value),
      distinctUntilChanged(),
      // map(val => this.splitToWords(val)),
      shareReplay(1),
      takeUntil(this.destroyed$)
    );

    this.videosList$ = this.selectedCompanyTypeChange.pipe(
      switchMap(() => this.helpCenterService.requestVideoList()),
      map((response:any) => (!response.error ? response.body : null)),
      tap((response:any) => {
        if (Array.isArray(response)) {
          response.forEach((item) => {
            item.vimeoData = this.helpCenterService.requestVimeoData(item.url);
          });
        }
      }),
      shareReplay(1),
      // publishReplay(1),
      // refCount(),
      takeUntil(this.destroyed$)
    );
  }



  // noinspection JSMethodCanBeStatic
  private toRegExp(text: string): RegExp {
    if (!text) {
      return null;
    }
    return new RegExp(text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
  }

  // private splitToWords(val: string): Array<string> {
  //     return !val ? [] : val.split(' ').map(part => part.trim()).filter(part => part);
  // }
  //
  // private filterList<T extends Searchable>(list: Array<T>, wordsToSearch: Array<string>): Array<T> {
  //     if (!Array.isArray(list)) {
  //         return [];
  //     }
  //
  //     if (!Array.isArray(wordsToSearch) || !wordsToSearch.length) {
  //         return list;
  //     }
  //
  //     const filtered = list.filter((faq) => {
  //         return faq.keywords.some(kw => {
  //             return wordsToSearch.some(wrd => kw.keyword.includes(wrd));
  //         });
  //     });
  //
  //     return filtered;
  // }

  handleQuestionClick(faq: QuestionData, evt: Event) {
    if (
      !(faq.question in this.responsesParsed) &&
      faq.linkText &&
      faq.linkAction
    ) {
      const regex = this.toRegExp(faq.linkText);
      // this.responsesParsed[faq.question] = this._sanitizer.bypassSecurityTrustHtml(
      //     msg.messageTemplate.replace(regex,
      //         '<button class="button-link linked_text">'
      //         + msg.linked_text + '</button>'));
      this.responsesParsed[faq.question] =
        this._sanitizer.bypassSecurityTrustHtml(
          faq.answer.replace(
            regex,
            '<button class="button-link linked_text">' +
              faq.linkText +
              '</button>'
          )
        );
    }

    if (
      evt.target instanceof HTMLElement &&
      (evt.target as HTMLElement).classList.contains('linked_text')
    ) {
      this.handleQuestionActionClick(faq, faq.linkAction);
      evt.stopPropagation();
    } else {
      (faq as any).expanded = !(faq as any).expanded;
    }
  }

  handleQuestionActionClick(faq: QuestionData, action: string) {
    console.log('handleQuestionActionClick ==> %o with %o', action, faq);

    const goActionMatch = /go:(.+)/g.exec(action);
    if (goActionMatch !== null) {
      this.router
        .navigate(
          [
            `/${this.userService.appData.userData.pathMainApp}/${goActionMatch[1]}`
          ],
          {
            queryParamsHandling: 'preserve'
          }
        )
        .then(() => {
          // if (this.dialog) {
          //     requestAnimationFrame(() => this.dialog.visible = false);
          // }
        });
    }

    const openActionMatch = /open:(.+)/g.exec(action);
    if (openActionMatch !== null) {
      if (
        openActionMatch[1] === 'payment recommendation' &&
        this.sharedComponent
      ) {
        // if (this.dialog) {
        //     requestAnimationFrame(() => this.dialog.visible = false);
        // }
        this.sharedComponent.recommendationCalculatorShow = true;
      }
    }
  }

  // displayFn(option?: TermData | QuestionData): string | undefined {
  //     if (!option) {
  //         return undefined;
  //     }
  //     if (option instanceof TermData || ((<any>option).subject)) {
  //         return (option as TermData).subject;
  //     } else if (option instanceof QuestionData || (<any>option).question) {
  //         return (option as QuestionData).question;
  //     }
  //     return undefined;
  // }

  // hintSelected($event: MatAutocompleteSelectedEvent) {
  //     // debugger;
  //     // this.searchFC.setValue(this.displayFn($event.option.value), {emitEvent: false});
  //     // $event.option
  // }

  optionSelected<T extends Searchable>(
    $event: MatOptionSelectionChange,
    searchable: T
  ) {
    if (
      $event.source.selected &&
      Array.isArray(searchable.screens) &&
      searchable.screens.length
    ) {
      this.router
        .navigate([searchable.screens[0].screenName], {
          relativeTo: this.activatedRoute,
          queryParamsHandling: 'preserve'
        })
        .then((result) => {
          if (result) {
            this.helpCenterService.navigateSearchable$.next(searchable);
          }
        });

      // if (searchable instanceof TermData || ((<any>searchable).subject)) {
      //     textToSearch = (<any>searchable).subject;
      // } else if (searchable instanceof QuestionData || (<any>searchable).question) {
      //     textToSearch = (<any>searchable).question;
      // }
    }
  }
}
