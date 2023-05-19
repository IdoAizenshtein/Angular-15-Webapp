import {
    ApplicationRef,
    ComponentRef,
    Directive,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    HostListener,
    Injector,
    Input,
    Output,
    ViewContainerRef
} from '@angular/core';
import {AdditionalInfo} from './additional-info';
import {ChecksViewComponent} from './checks-view/checks-view.component';
import {TransferViewComponent} from './transfer-view/transfer-view.component';
import {UnionViewComponent} from './union-view/union-view.component';
import {combineLatest} from 'rxjs';
import {SharedService} from '@app/shared/services/shared.service';
import {UserService} from '@app/core/user.service';
import {TodayRelativeHumanizePipe} from '../../pipes/todayRelativeHumanize.pipe';

@Directive({
    selector: '[appTransactionAdditionalTrigger]'
})
export class TransactionAdditionalTriggerDirective {
    constructor(
        private el: ElementRef,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        public sharedService: SharedService,
        public userService: UserService,
        private viewContainerRef: ViewContainerRef,
        private appRef: ApplicationRef,
        private injector: Injector
    ) {
    }

    @Input() appTransactionAdditionalTrigger: any;
    @Input() isJournal: any = false;
    @Input() disabledClick: any = false;

    public companyCustomerDetails: any = false;

    @Input()
    set companyCustomerDetailsArr(companyCustomerDetails: any) {
        this.companyCustomerDetails = companyCustomerDetails;
    }

    @Input() isCustIdCards: any = false;
    @Output() refresh = new EventEmitter<any>();
    @Output() companyGetCustomer = new EventEmitter<any>();
    @Output() showArchiveModalFromTransactionAdditional = new EventEmitter<any>();

    public componentRef: ComponentRef<AdditionalInfo>;

    private changes: MutationObserver;

    @Input()
    set updateTrans(data: any) {
        if (
            data &&
            this.componentRef &&
            this.componentRef.instance &&
            this.componentRef.instance.transaction
        ) {
            this.componentRef.instance.updateTrans = data;
        }
    }

    // @HostListener('mouseenter') onMouseEnter() {
    //     this.toggleAdditionals();
    // }
    //
    // @HostListener('mouseleave') onMouseLeave() {
    //     this.toggleAdditionals();
    // }
    @HostListener('click', []) onclick() {
        if (!this.disabledClick) {
            document.body.click();
            if (window['mixpanel']) {
                if(this.appTransactionAdditionalTrigger.paymentDesc){
                    window['mixpanel'].track('payment type', {
                        'type': this.appTransactionAdditionalTrigger.paymentDesc
                    });
                }
                if (
                    this.appTransactionAdditionalTrigger.pictureLink ||
                    (this.appTransactionAdditionalTrigger.splitArrayBase &&
                        this.appTransactionAdditionalTrigger.splitArrayBase.paymentDesc === 'Checks')
                ) {
                    window['mixpanel'].track('perut check');
                    // factory = ChecksViewComponent;
                } else if (this.appTransactionAdditionalTrigger.unionId) {
                    // factory = UnionViewComponent;
                } else {
                    window['mixpanel'].track('perut bank transfer');
                    // factory = TransferViewComponent;
                }
            }

            this.toggleAdditionals();
        }
    }

    private setupTransItemView(trns: any): void {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc) => acc.companyAccountId === trns.companyAccountId
        );

        return Object.assign(trns, {
            account: trnsAcc,
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            accountNickname: trnsAcc ? trnsAcc.accountNickname : null
        });
    }

    private toggleAdditionals() {
        if (this.componentRef !== undefined) {
            this.removeComponentFromBody();
        } else {
            if (this.appTransactionAdditionalTrigger && this.appTransactionAdditionalTrigger.msg) {
                const todayParameters: any = {
                    companyAccountIds: [this.appTransactionAdditionalTrigger.msg.companyAccountId],
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    dateFrom: new Date().toISOString(),
                    dateTill: new Date().toISOString()
                };
                const parameters: any = {
                    companyAccountIds: [this.appTransactionAdditionalTrigger.msg.companyAccountId],
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    dateFrom: this.userService.appData
                        .moment()
                        .subtract(30, 'days')
                        .valueOf(),
                    dateTill: this.userService.appData.moment().add(30, 'days').valueOf()
                };
                if (this.userService.appData.userData.accountSelect.length) {
                    // tslint:disable-next-line:max-line-length
                    combineLatest(
                        [
                            this.sharedService.getBankTransPeulotToday(todayParameters),
                            this.sharedService.getBankTrans(parameters)
                        ]
                    ).subscribe(
                        (response: any) => {
                            let messagesToday = response[0]
                                ? response[0]['body']
                                : response[0];
                            messagesToday = messagesToday.map((trns) =>
                                this.setupTransItemView(trns)
                            );
                            let messages = response[1]
                                ? response[1]['body'].bankTransList
                                : response[1];
                            messages = messages.map((trns) => this.setupTransItemView(trns));
                            const allTrans = messagesToday.concat(messages);
                            const rowInfo = allTrans.find(
                                (it) => it.bankTransId === this.appTransactionAdditionalTrigger.msg.keyId
                            );
                            if (rowInfo) {
                                this.appTransactionAdditionalTrigger = rowInfo;
                                this.appendComponentToBody();
                            }
                        }
                    );
                }
            } else {
                this.appendComponentToBody();
            }
        }
    }

    private appendComponentToBody() {
        if (
            !this.appTransactionAdditionalTrigger ||
            (!this.appTransactionAdditionalTrigger.pictureLink &&
                !this.appTransactionAdditionalTrigger.linkId &&
                !this.appTransactionAdditionalTrigger.unionId &&
                !this.appTransactionAdditionalTrigger.splitArrayBase)
        ) {
            return;
        }

        // 1. Create a component reference from the component
        let factory: any;
        if (
            this.appTransactionAdditionalTrigger.pictureLink ||
            (this.appTransactionAdditionalTrigger.splitArrayBase &&
                this.appTransactionAdditionalTrigger.splitArrayBase.paymentDesc === 'Checks')
        ) {
            factory = ChecksViewComponent;
        } else if (this.appTransactionAdditionalTrigger.unionId) {
            factory = UnionViewComponent;
        } else {
            factory = TransferViewComponent;
        }

        this.viewContainerRef.clear();
        // 1. Create a component reference from the component
        this.componentRef = this.viewContainerRef.createComponent(factory, {
            injector: this.injector
        });
        if (!this.componentRef) {
            return;
        }

        // 2. Attach component to the appRef so that it's inside the ng component tree
        // this.appRef.attachView(this.componentRef.hostView);

        // 3. Get DOM element from component
        const domElem = (this.componentRef.hostView as EmbeddedViewRef<any>)
            .rootNodes[0] as HTMLElement;

        // 4. Append DOM element to the body
        document.body.appendChild(domElem);
        this.componentRef.instance.companyCustomerDetails =
            this.companyCustomerDetails;
        this.componentRef.instance.isCustIdCards = this.isCustIdCards;
        this.componentRef.instance.isJournal = this.isJournal;
        this.componentRef.instance.transaction = this.appTransactionAdditionalTrigger;
        setTimeout(() => {
            this.componentRef.instance.closed.subscribe(() => {
                // console.log('----> this.componentRef.instance.close.subscribe: %o', val);
                this.removeComponentFromBody();
            });
            this.componentRef.instance.refresh.subscribe(() => {
                this.refresh.emit(true);
            });
            this.componentRef.instance.companyGetCustomer.subscribe((event) => {
                this.companyGetCustomer.emit(event);
            });
            this.componentRef.instance.showArchiveModalFromTransactionAdditional.subscribe(
                (event) => {
                    this.removeComponentFromBody();
                    this.showArchiveModalFromTransactionAdditional.emit(event);
                }
            );
        }, 0);

        this.startSizeTracing(domElem.firstElementChild as HTMLElement);
    }

    private removeComponentFromBody() {
        if (this.componentRef) {
            if (this.componentRef.hostView) {
                this.appRef.detachView(this.componentRef.hostView);
            }
            this.changes.disconnect();
            this.componentRef.destroy();
            setTimeout(()=>{
                this.componentRef = undefined;
            }, 10)
        }
    }

    private startSizeTracing(popup: HTMLElement) {
        popup.style.visibility = 'hidden';
        this.changes = new MutationObserver((mutations: MutationRecord[]) => {
            // console.log('%o', mutations);
            if (mutations.length) {
                this.locateRelatively(mutations[0].target as HTMLElement);
                popup.style.visibility = 'visible';
            }
            // mutations.forEach((mutation: MutationRecord) => {
            //     console.log('%o', mutation.target);
            //     this.locateRelatively(mutation.target as HTMLElement);
            // });
        });

        this.changes.observe(popup, {
            attributes: true,
            // childList: true,
            // characterData: true,
            attributeFilter: ['style']
        });
    }

    private locateRelatively(popup: HTMLElement) {
        const rect = popup.getBoundingClientRect();
        const anchorRect = this.el.nativeElement.getBoundingClientRect();
        const arrow = popup.querySelector('.arrow') as HTMLElement;
        const arrowRect = arrow.getBoundingClientRect();

        const minX = window.scrollX + 10,
            maxX = window.scrollX + document.documentElement.clientWidth - 20,
            // minY =  window.scrollY + 10,
            maxY = window.scrollX + document.documentElement.clientHeight - 20;

        let y, arrowy;
        if (anchorRect.bottom + rect.height <= maxY) {
            // bottom
            y = anchorRect.bottom + 13;
            popup.classList.remove('arrow-down');
            popup.classList.add('arrow-up');
            arrowy = -14;
        } else {
            // top
            y = anchorRect.top - rect.height - 13;
            popup.classList.add('arrow-down');
            popup.classList.remove('arrow-up');
            arrowy = rect.height - 2;
        }

        // console.log(anchorRect.left, anchorRect.width, anchorRect, arrowRect)
        // let x = anchorRect.left + anchorRect.width / 2 - rect.width / 2;
        let x = anchorRect.right - 55;
        if (x <= minX) {
            x = minX;
        } else if (x + rect.width > maxX) {
            x = maxX - rect.width;
        }
        // const arrowx =
        //     anchorRect.left + anchorRect.width / 2 - x - arrowRect.width / 2;

        const arrowx = 25;

        // console.log('anchorRect = %o, x = %o, y = %o',
        //     anchorRect, x, y);

        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        arrow.style.left = arrowx + 'px';
        arrow.style.top = arrowy + 'px';
    }
}
