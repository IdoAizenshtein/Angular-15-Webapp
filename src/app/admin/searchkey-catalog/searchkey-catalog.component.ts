import {Component, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation} from '@angular/core';
import {AdminService} from '../admin.service';
import {FormControl, FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {PaginatorComponent} from '@app/shared/component/paginator/paginator.component';
import {Dropdown} from 'primeng/dropdown';
import {BehaviorSubject, combineLatest, Observable, Subject, zip} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith, switchMap, tap} from 'rxjs/operators';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './searchkey-catalog.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SearchkeyCatalogComponent implements OnInit {
    searchkeys$: Observable<{
        bankId: number;
        misparHofaot: number;
        searchkey: string;
        searchkeyCatId: string;
        searchkeyCatName: string;
        searchkeyId: string;
        transTypeName: string;
        bankName: string;
    }[]>;

    banks$: Observable<{ label: string; value: number }[]>;
    paymentTypes$: Observable<{ label: string; value: string }[]>;
    paymentTypesById$: Observable<{ label: string; value: string }[]>;
    categories$: Observable<{ label: string; value: string }[]>;

    filter: any;

    currentPage = 0;
    entryLimit = 100; // 50;
    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;

    @ViewChildren(Dropdown) dropdowns: QueryList<Dropdown>;

    private _selectedRow: {
        bankId: number;
        misparHofaot: number;
        searchkey: string;
        searchkeyCatId: string;
        searchkeyCatName: string;
        searchkeyId: string;
        transTypeName: string;
    };
    get selectedRow() {
        return this._selectedRow;
    }

    set selectedRow(val: {
        bankId: number;
        misparHofaot: number;
        searchkey: string;
        searchkeyCatId: string;
        searchkeyCatName: string;
        searchkeyId: string;
        transTypeName: string;
    }) {
        if (!val || this.editingRow !== val) {
            this.editingRow = null;
        }

        this._selectedRow = val;
    }

    private _editingRow: {
        bankId: number;
        misparHofaot: number;
        searchkey: string;
        searchkeyCatId: string;
        searchkeyCatName: string;
        searchkeyId: string;
        transTypeName: string;
    };
    get editingRow() {
        return this._editingRow;
    }

    set editingRow(val: {
        bankId: number;
        misparHofaot: number;
        searchkey: string;
        searchkeyCatId: string;
        searchkeyCatName: string;
        searchkeyId: string;
        transTypeName: string;
    }) {
        if (val && this.selectedRow !== val) {
            this.selectedRow = val;
        }

        this._editingRow = val;
    }

    sortBy: { [key: string]: string };
    private sortBy$: BehaviorSubject<{ [key: string]: string }> =
        new BehaviorSubject<{ [p: string]: string }>(null);
    loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

    // searchForm: any;
    bankIdFilterOptions$: Observable<Array<{ id: number; val: string }>>;
    transTypeFilterOptions$: Observable<Array<{ id: string; val: string }>>;
    paymentTypeFilterOptions$: Observable<Array<{ id: string; val: string }>>;

    private readonly forceReload$ = new Subject<void>();

    constructor(
        private adminService: AdminService,
        public translate: TranslateService
    ) {
        this.filter = new FormGroup({
            bankId: new FormControl(''),
            misparHofaot: new FormControl(50),
            paymentDesc: new FormControl(''),
            transTypeId: new FormControl(''),
            type: new FormControl('notFixed'),
            searchkey: new FormControl('')
        });

        // this.searchForm = new FormGroup({
        //     query: new FormControl('')
        // });
    }

    ngOnInit(): void {
        this.banks$ = this.adminService.banksList.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        label: value.bankName,
                        value: value.bankId
                    };
                });
            }),
            publishRef
        );

        this.bankIdFilterOptions$ = this.banks$.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        id: value.value,
                        val: value.label
                    };
                });
            }),
            publishRef
        );

        // this.dictionaryEnumAsDDModel('banks');
        this.paymentTypes$ = this.adminService.paymentTypes.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        label: value.name,
                        value: value.paymentDescription
                    };
                });
            }),
            publishRef
        );
        // this.dictionaryEnumAsDDModel('paymentTypes');

        this.paymentTypesById$ = this.adminService.paymentTypes.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        label: value.name,
                        value: value.id
                    };
                });
            }),
            publishRef
        );

        this.paymentTypeFilterOptions$ = this.paymentTypesById$.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        id: value.value,
                        val: value.label
                    };
                });
            }),
            publishRef
        );

        this.categories$ = this.adminService.categories.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        label: value.transTypeName,
                        value: value.transTypeId
                    };
                });
            }),
            publishRef
        );

        this.transTypeFilterOptions$ = this.categories$.pipe(
            map((rslt) => {
                return rslt.map((value) => {
                    return {
                        id: value.value,
                        val: value.label
                    };
                });
            }),
            publishRef
        );

        const searchkeysLoad$ = combineLatest(
         [
             this.filter.valueChanges.pipe(
                 startWith(this.filter.value),
                 debounceTime(300),
                 distinctUntilChanged((val1, val2) => {
                     return (
                         (val1 === null) === (val2 === null) &&
                         Object.keys(val2)
                             .filter((k) => val2.hasOwnProperty(k))
                             .every((k) => (!val1[k] && !val2[k]) || val1[k] === val2[k])
                     );
                 }),
                 tap(() => (this.currentPage = 0))
             ),
             this.forceReload$.pipe(startWith(null))
         ]
        ).pipe(
            map(([filterVal]) => filterVal),
            tap(() => this.loading$.next(true)),
            switchMap((filterVal) => {
                let containsNonEmptyVal = false;
                const requestParams: any = Object.assign(
                    {currPage: this.currentPage}, // Object.create(null),
                    filterVal,
                    filterVal['type'] !== 'fixed' ? {transTypeId: null} : {}
                );
                Object.keys(requestParams).forEach((k) => {
                    if (requestParams[k] === '') {
                        requestParams[k] = null;
                    } else {
                        containsNonEmptyVal = true;
                    }
                });

                return combineLatest(
            [
                containsNonEmptyVal
                    ? this.adminService.searchKeysGetFiltered(requestParams)
                    : this.adminService.searchKeysGetFiltered(),
                this.adminService.banksList,
                this.adminService.categories
            ]
                );
            }),
            map(([resp, banks, categories]) => {
                const sortkeys = resp.error
                    ? null
                    : (resp.body as {
                        bankId: number;
                        misparHofaot: number;
                        searchkey: string;
                        searchkeyCatId: string;
                        searchkeyCatName: string;
                        searchkeyId: string;
                        transTypeName: string;
                    }[]);

                sortkeys.forEach((row) => {
                    Object.assign(
                        row,
                        banks.find((bnk) => bnk.bankId === row.bankId),
                        categories.find((cat) => cat.transTypeName === row.transTypeName)
                    );
                });

                return sortkeys;
            }),
            tap(() => this.loading$.next(false))
        );

        this.searchkeys$ = combineLatest(
     [
         searchkeysLoad$,
         this.sortBy$
         /* ,
             this.searchForm.valueChanges
                 .pipe(
                     debounceTime(300),
                     distinctUntilChanged(),
                     startWith(this.searchForm.value)
                 )*/
     ]
        ).pipe(
            tap(() => {
                this.hideDropdowns();
                if (this.paginator) {
                    this.paginator.changePage(0);
                }
            }),
            map(([searchkeysArr, sortBy /*, searchFormVal*/]) => {
                const regexFilter = null; // this.toRegExp(searchFormVal.query);
                const resultArr =
                    (regexFilter === null)
                        ? searchkeysArr
                        : searchkeysArr.filter((row) => regexFilter.test(row.searchkey));
                if (sortBy) {
                    const sortedArr = [].concat(...resultArr);
                    const factor = sortBy[Object.keys(sortBy)[0]] === 'desc' ? -1 : 1;
                    sortedArr.sort((a, b) => {
                        switch (Object.keys(sortBy)[0]) {
                            case 'bank':
                                return (
                                    this.compareStringVals(
                                        this.translate.instant('banks.' + a.bankId),
                                        this.translate.instant('banks.' + b.bankId)
                                    ) * factor
                                );
                            case 'searchkey':
                                return (
                                    this.compareStringVals(a.searchkey, b.searchkey) * factor
                                );
                            case 'searchkeyCatName':
                                return (
                                    this.compareStringVals(
                                        a.searchkeyCatName,
                                        b.searchkeyCatName
                                    ) * factor
                                );
                            case 'misparHofaot':
                                return (
                                    this.compareNumberVals(a.misparHofaot, b.misparHofaot) *
                                    factor
                                );
                        }
                        return 0;
                    });
                    return sortedArr;
                }
                return resultArr;
            }),
            publishRef
        );
    }

    // noinspection JSMethodCanBeStatic
    private toRegExp(text: string): RegExp {
        if (!text) {
            return null;
        }
        return new RegExp(text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    }

    // private dictionaryEnumAsDDModel(key: string): Observable<{ label: string, value: string }[]> {
    //     return this.translate.get(key)
    //         .pipe(
    //             map(rslt => Object.entries(rslt)
    //                 .map(([id, val]) => {
    //                     return {
    //                         label: val,
    //                         value: id
    //                     };
    //                 }) as { label: string, value: string }[]),
    //             publishReplay(1),
    //             refCount()
    //         );
    // }

    recordTrack(idx, rec) {
        return rec.bankId + rec.searchkey;
    }

    hideDropdowns() {
        if (!this.editingRow) {
            return;
        }

        this.dropdowns.forEach((dd) => dd.hide());
    }

    toggleSort(key: string) {
        if (!this.sortBy || Object.keys(this.sortBy)[0] !== key) {
            this.sortBy = {
                [key]: 'desc'
            };
        } else if (this.sortBy[key] === 'asc') {
            this.sortBy = null;
        } else {
            this.sortBy[key] = 'asc';
        }
        this.sortBy$.next(this.sortBy);
    }

    // noinspection JSMethodCanBeStatic
    private compareStringVals(a: string, b: string): number {
        return a || b ? (!a ? -1 : !b ? 1 : a.localeCompare(b)) : 0;
    }

    // noinspection JSMethodCanBeStatic
    private compareNumberVals(a: number, b: number): number {
        return a || b ? (!a ? -1 : !b ? 1 : a - b) : 0;
    }

    update(item: {
        searchkeyCatId: string;
        searchkeyId: string;
        transTypeId: string;
    }): void {
        this.loading$.next(true);
        this.adminService
            .searchkeyUpdate([item])
            .subscribe({
                next: (resp: any) => {
                    if (resp && !resp.error) {
                        this.loading$.next(false)
                        this.forceReload$.next();
                    } else {
                        this.loading$.next(false)
                    }
                },
                error: (e) => this.loading$.next(false),
                complete: () => console.info('complete')
            })

    }

    paymentTypeFilterChanged(checked: Array<{ id: string; val: string }>) {
        if (!Array.isArray(checked) || !checked.length) {
            this.filter.patchValue({paymentDesc: ''});
        } else {
            this.adminService.paymentTypes.subscribe((paymentTypesArr) => {
                const paymentTypeFound = paymentTypesArr.find(
                    (pt) => pt.id === checked[0].id
                );
                this.filter.patchValue({
                    paymentDesc: paymentTypeFound
                        ? paymentTypeFound.paymentDescription
                        : ''
                });
            });
        }
    }

    prevPage() {
        const gotoPage = Math.max(this.currentPage - 1, 0);
        if (gotoPage < this.currentPage) {
            this.currentPage = gotoPage;
            this.forceReload$.next();
        }
    }

    nextPage() {
        this.currentPage += 1;
        this.forceReload$.next();
    }
}
