import {
    AfterViewInit,
    Directive,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges
} from '@angular/core';
import {BrowserService} from '@app/shared/services/browser.service';
import {UserService} from '@app/core/user.service';
import {Observable} from 'rxjs';

@Directive()
export class AdditionalInfo implements OnChanges, AfterViewInit, OnDestroy {
    private _transaction: {
        companyAccountId: string;
        hova: boolean;
        expence?: any;
        transDate: number;
        account: {
            bankId: string;
            bankSnifId: string;
            bankAccountId: string;
            accountNickname: string;
        };
        pictureLink: string;
        linkId: string;
        total: number;
        bankTransId: string;
        transId: string;
        unionId: string;
        // originalDate: number
        kvuaDateFrom: number;
        source?: string;
        depositDate?: number;
        chequeAccountNumber?: number;
        chequeBankNumber?: number;
        chequeBranchNumber?: number;
        chequeNumber?: number;
        chequeTotal?: number;
        imageNameKey?: string;
        image?: string;
        splitArrayBase?: any;
    };

    get transaction() {
        return this._transaction;
    }

    private _isJournal: boolean;
    get isJournal() {
        return this._isJournal;
    }

    @Input()
    set isJournal(val: any) {
        this._isJournal = val;
    }

    private _isCustIdCards: boolean;
    get isCustIdCards() {
        return this._isCustIdCards;
    }

    @Input()
    set isCustIdCards(val: any) {
        this._isCustIdCards = val;
    }

    private _companyCustomerDetails: any;
    get companyCustomerDetails() {
        return this._companyCustomerDetails;
    }

    @Input()
    set companyCustomerDetails(val: any) {
        this._companyCustomerDetails = val;
    }

    @Input()
    set transaction(val: {
        companyAccountId: string;
        hova: boolean;
        expence?: any;
        transDate: number;
        account: {
            bankId: string;
            bankSnifId: string;
            bankAccountId: string;
            accountNickname: string;
        };
        pictureLink: string;
        linkId: string;
        total: number;
        bankTransId: string;
        transId: string;
        unionId: string;
        // originalDate: number
        kvuaDateFrom: number;
        source?: string;
        depositDate?: number;
        chequeAccountNumber?: number;
        chequeBankNumber?: number;
        chequeBranchNumber?: number;
        chequeNumber?: number;
        chequeTotal?: number;
        imageNameKey?: string;
        image?: string;
        splitArrayBase?: any;
    }) {
        this._transaction = val;
        this.isFutureTransaction =
            val &&
            ((val.transDate &&
                    this.userService.appData.moment().isBefore(val.transDate)) ||
                ((<any>val).bank === false && (<any>val).nigreret === false));
        this.reload();
    }

    additionalDetails$: Observable<any>;

    @Input()
    set updateTrans(data: any) {
        // this.reload();
        const locationsSubscription = this.additionalDetails$.subscribe((arr) => {
            if (locationsSubscription) {
                locationsSubscription.unsubscribe();
            } else {
                const isSameTransId = arr.find((it) => it.transId === data.transId);
                if (isSameTransId) {
                    isSameTransId.custId = data.custId;
                }
            }
        });
    }

    isFutureTransaction = false;

    @Output() closed = new EventEmitter<any>();
    @Output() refresh = new EventEmitter<any>();
    @Output() companyGetCustomer = new EventEmitter<any>();
    @Output() showArchiveModalFromTransactionAdditional = new EventEmitter<any>();

    readonly closeIfScrolledOutside = function (this: any, event) {
        // console.log('scroll ----> ');
        const eventPath = BrowserService.pathFrom(event);
        const elementRefInPath =
            eventPath[0].classList.contains('bank-acc-details-link') ||
            eventPath.includes(
                (this.el.nativeElement as HTMLElement).firstElementChild
            ) ||
            eventPath.find(
                (el) =>
                    el instanceof HTMLElement &&
                    ((<HTMLElement>el).classList.contains('p-dropdown-panel') ||
                        (<HTMLElement>el).classList.contains('p-dialog'))
            );
        if (!elementRefInPath) {
            this.hideInfo();
        }
    }.bind(this);

    showInfo = true;

    constructor(protected el: ElementRef, protected userService: UserService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['transaction']) {
            this.reload();
        }
    }

    ngAfterViewInit() {
        // this.render.listen('document', 'scroll', () => {
        //     console.log('scroll')
        //     const elementRefInPath = BrowserService.pathFrom(event).includes(this.el.nativeElement);
        //     if (!elementRefInPath) {
        //         this.hideInfo();
        //     }
        // });
        document.addEventListener('scroll', this.closeIfScrolledOutside, true);
        document.addEventListener('click', this.closeIfScrolledOutside, true);
    }

    ngOnDestroy() {
        document.removeEventListener('scroll', this.closeIfScrolledOutside, true);
        document.removeEventListener('click', this.closeIfScrolledOutside, true);
        this.closed.complete();
    }

    protected reload(): void {
    }

    hideInfo() {
        this.showInfo = false;
        this.closed.emit();
    }

    exit() {
        this.reload();
    }
}
