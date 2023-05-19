import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {OcrService} from '../ocr.service';

@Component({
    selector: 'app-cust-selector',
    templateUrl: './cust-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [slideInOut]
})
export class CustSelectorComponent implements OnInit {
    public companyCustomerDetails: any = false;
    public companyCustomerDetailsForFilter: any = false;
    readonly query: FormControl;
    @ViewChild('selector', {read: ElementRef}) selectorRef: ElementRef;

    @Input() disabled: boolean = false;
    @Input() selectedCompany: any;
    @Output() selectedCustChange = new EventEmitter<any>();
    @Output() selectedCustSet = new EventEmitter<any>();
    @Input() rowForMatchCust: any;
    @Input() showFloatNav: any;
    @Input() fileStatus: any;

    constructor(private ocrService: OcrService) {
        this.query = new FormControl('');
    }

    private _selectedCust: any;

    get selectedCust(): any {
        return this._selectedCust;
    }

    set selectedCust(val: any) {
        if (this._selectedCust !== val) {
            this.selectedCustChange.next(val);
        }
        this._selectedCust = val;
    }

    @Input()
    set zCompanyCustomerDetailsArr(companyCustomerDetails: any) {
        // this.companyCustomerDetails = companyCustomerDetails.filter(it => it.cartisCodeId === 1300 || it.cartisCodeId === 1400 || it.cartisCodeId === 3 || it.cartisCodeId === 7 || it.cartisCodeId === 1000 || it.cartisCodeId === 1011).map(it => {
        //     return {
        //         custId: it.custId,
        //         lName: it.custLastName,
        //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
        //         id: it.palCode
        //     };
        // });
        // this.companyCustomerDetails.unshift({
        //     custId: null,
        //     lName: 'ללא',
        //     hp: null,
        //     id: null
        // });
        // console.log(this.companyCustomerDetails);
        if (companyCustomerDetails && (!!this.rowForMatchCust || !!this.showFloatNav)) {
            companyCustomerDetails.forEach((it) => {
                it.disabled = this.rowForMatchCust
                    ? this.rowForMatchCust[this.fileStatus].izuCustId === it.custId
                    : this.showFloatNav.selcetedFiles.some(
                        (item) => item[this.fileStatus].izuCustId === it.custId
                    );
            });
            this.companyCustomerDetails = JSON.parse(
                JSON.stringify(companyCustomerDetails)
            );
            this.companyCustomerDetailsForFilter = JSON.parse(
                JSON.stringify(companyCustomerDetails)
            );
            console.log(this.companyCustomerDetailsForFilter)
        }

    }

    ngOnInit() {
        // this.ocrService.companyGetCustomer({
        //     companyId: this.selectedCompany.companyId,
        //     sourceProgramId: this.selectedCompany.sourceProgramId
        // }).subscribe((res) => {
        //         const companyCustomerDetails = (res) ? res['body'] : res;
        //
        //         this.companyCustomerDetails = companyCustomerDetails.filter(it => it.cartisCodeId === 1300 || it.cartisCodeId === 1400 || it.cartisCodeId === 3 || it.cartisCodeId === 7 || it.cartisCodeId === 1000 || it.cartisCodeId === 1011).map(it => {
        //             return {
        //                 custId: it.custId,
        //                 lName: it.custLastName,
        //                 hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
        //                 id: it.palCode
        //             };
        //         });
        //         this.companyCustomerDetails.unshift({
        //             custId: null,
        //             lName: 'ללא',
        //             hp: null,
        //             id: null
        //         });
        //         console.log(this.companyCustomerDetails);
        //         this.companyCustomerDetailsForFilter = JSON.parse(JSON.stringify(this.companyCustomerDetails));
        //
        //     }, (err: HttpErrorResponse) => {
        //         if (err.error) {
        //             console.log('An error occurred:', err.error.message);
        //         } else {
        //             console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        //         }
        //     }
        // );

        this.query.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.companyCustomerDetailsForFilter = JSON.parse(
                    JSON.stringify(this.companyCustomerDetails)
                );
                if (this.companyCustomerDetailsForFilter.length) {
                    this.companyCustomerDetailsForFilter = !term
                        ? this.companyCustomerDetailsForFilter
                        : this.companyCustomerDetailsForFilter.filter((fd) => {
                            return [fd.lName, fd.custId]
                                .filter(
                                    (v) =>
                                        (typeof v === 'string' || typeof v === 'number') && !!v
                                )
                                .some((vstr) => vstr.toString().includes(term));
                        });
                    if (!this.companyCustomerDetailsForFilter.length) {
                        this.selectedCustChange.next(true);
                    }
                }
            });
    }

    isShowAddItemTemp() {
        const filter = this.query.value.length > 0;
        if (
            filter &&
            this.companyCustomerDetailsForFilter &&
            this.companyCustomerDetailsForFilter.length
        ) {
            const isExistEqual = this.companyCustomerDetailsForFilter.find(
                (it) => it.custId === this.query.value
            );
            if (isExistEqual) {
                return false;
            } else {
                return true;
            }
        }
        if (
            filter &&
            this.companyCustomerDetailsForFilter &&
            !this.companyCustomerDetailsForFilter.length
        ) {
            return true;
        }
        if (
            (filter && !this.companyCustomerDetailsForFilter) ||
            (this.companyCustomerDetailsForFilter &&
                !this.companyCustomerDetailsForFilter.length)
        ) {
            return true;
        }
        return false;
    }

    setValCartis() {
        this.selectedCust = {
            cartisName: this.query.value,
            custId: this.query.value,
            hp: null,
            id: null,
            lName: null
        };
        this.selectedCustSet.next(this.selectedCust);
    }

    trackCust(idx: number, item: any) {
        return (item ? item.custId : null) || idx;
    }
}
