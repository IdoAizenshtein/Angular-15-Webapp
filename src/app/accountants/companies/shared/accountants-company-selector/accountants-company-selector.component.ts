import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {combineLatest, Observable, Subject, zip} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, shareReplay, startWith} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service';
import {FormControl} from '@angular/forms';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    selector: 'app-accountants-company-selector',
    templateUrl: './accountants-company-selector.component.html',
    encapsulation: ViewEncapsulation.None
})
export class AccountantsCompanySelectorComponent implements OnInit, OnDestroy {
    companiesFitlered$: Observable<Array<any>>;
    readonly query: FormControl;
    @Input() selectedCompanyId: string;
    @Output() selectedCompanyChange = new EventEmitter<any>();
    private companies$: Observable<Array<any>>;
    private readonly destroyed$ = new Subject<void>();

    constructor(private sharedService: SharedService) {
        this.query = new FormControl('');
    }

    private _selectedCompany: any;

    get selectedCompany(): any {
        return this._selectedCompany;
    }

    set selectedCompany(val: any) {
        if (this._selectedCompany !== val) {
            this.selectedCompanyChange.next(val);
        }
        this._selectedCompany = val;
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    ngOnInit() {
        this.companies$ = this.sharedService.getCompanies().pipe(
            map((response: any) =>
                response && Array.isArray(response.body)
                    ? response.body.filter((it) => it.supplierJournalItem)
                    : response.filter((it) => it.supplierJournalItem)
            ),
            shareReplay(1)
        );

        this.companiesFitlered$ = combineLatest(
      [
          this.companies$,
          this.query.valueChanges.pipe(
              debounceTime(400),
              distinctUntilChanged(),
              startWith(this.query.value),
              map((val) =>
                  !val
                      ? val
                      : new RegExp(val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi')
              )
          )
      ]
        ).pipe(
            map(([companies, query]) => {
                if (!(query instanceof RegExp)) {
                    return companies;
                }

                return companies.filter(
                    (company) =>
                        query.test(company.companyName) ||
                        (company.companyHp !== null &&
                            company.companyHp !== undefined &&
                            query.test(String(company.companyHp)))
                );
            }),
            publishRef
        );
    }

    trackCompany(idx: number, item: any) {
        return (item ? item.companyId : null) || idx;
    }
}
