import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Optional,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {combineLatest, EMPTY, Observable, of, Subject, Subscription, timer, zip} from 'rxjs';
import {Message, MessagesService} from '@app/core/messages.service';
import {map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {FormControl, FormGroup} from '@angular/forms';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ActionService} from '@app/core/action.service';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers/customers.component';
import {CustomersGeneralComponent} from '@app/customers/general/customers-general.component';
import {UserService} from '@app/core/user.service';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {EditingType} from '../movement-editor/enums';
import {MovementEditorComponent} from '../movement-editor/movement-editor.component';
import {TransTypesService} from '@app/core/transTypes.service';
import {TodayRelativeHumanizePipe} from '../../pipes/todayRelativeHumanize.pipe';
import {DatePipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers/customers.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {TranslateService} from '@ngx-translate/core';
import {IsPeriodicTypePipe} from '../../pipes/isPeriodicTargetType.pipe';
import {ReportService} from '@app/core/report.service';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {publishRef} from '../../functions/publishRef';
import {Dialog} from "primeng/dialog";

@Component({
    selector: 'app-messages-list',
    templateUrl: './messages-list.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    providers: [TodayRelativeHumanizePipe, IsPeriodicTypePipe]
})
export class MessagesListComponent implements OnChanges, OnDestroy {
    @Input()
    messages$: Observable<Array<Message>>;

    @Input()
    separateNew = true;

    @Output() messagesSideShow = new EventEmitter();

    @Input()
    mode: 'notifications' | 'messages' = 'notifications';

    messagesSource$: Observable<Array<Message>>;
    messagesSeparatedNew$: Observable<Array<Message>>;
    messagesSeparatedOld$: Observable<Array<Message>>;
    public processingDeleteOperation: boolean = false;
    // private readonly messageIsNewIfAfter: moment.Moment;
    readonly filter: any;
    readonly severities: { label: string; value: string }[];

    readonly messagesParsed: { [k: string]: SafeHtml };

    private readonly msgEditPerformed: BehaviorSubject<void> =
        new BehaviorSubject(null);
    private actionDoneSub: Subscription;

    public companyTransTypes: any[] = [];
    private defaultTransType: any | null;
    private readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    readonly editorMultimodeForbiddenTypes = [
        'WIRE_TRANSFER',
        'CHEQUE',
        'OTHER',
        'BANK_CHEQUE',
        'ERP_CHEQUE'
    ];
    editMovementData: {
        visible1: any;
        visible: boolean;
        title: string;
        form: any;
        loading: boolean | null;
        source: any;
        seriesSource: any;
    };
    @ViewChild('editEditor') editEditor: MovementEditorComponent;
    @ViewChild('editEditorElem') editEditorElem: ElementRef;

    @ViewChild('editMovementDataDlg') editMovementDataDlg: Dialog;
    private readonly destroyed$ = new Subject<void>();
    public subscription: Subscription;
    private readonly destroyed1$ = new Subject<void>();
    public subscription1: Subscription;
    private readonly dtPipe: DatePipe;
    public getMessageFiles: any;
    public showDocumentStorageDataFired = false;
    public sidebarImgs: any = false;
    public window: any = window;
    public innerHeight: any = window.innerHeight;
    public imageScaleNewInvoice: number = 1;
    public degRotateImg: number = 0;

    constructor(
        private messageService: MessagesService,
        private _sanitizer: DomSanitizer,
        public actionService: ActionService,
        public reportService: ReportService,
        private ocrService: OcrService,
        public translate: TranslateService,
        @Optional() private dtHumanizePipe: TodayRelativeHumanizePipe,
        private restCommonService: RestCommonService,
        @Optional() private isPeriodicType: IsPeriodicTypePipe,
        @Optional() public sharedComponent: SharedComponent,
        public sharedService: SharedService,
        @Optional() public customersGeneralComponent: CustomersGeneralComponent,
        public userService: UserService,
        private transTypesService: TransTypesService
    ) {
        // this.messageIsNewIfAfter = moment().add(-2, 'weeks').startOf('day');
        this.dtPipe = new DatePipe('en-IL');

        this.filter = new FormGroup({
            severity: new FormControl('')
        });

        this.severities = [
            {label: 'כל ההתראות', value: ''},
            {label: 'אדומות', value: 'red'},
            {label: 'צהובות', value: 'yellow'},
            {label: 'מערכת', value: 'bizibox'}
        ];

        this.messagesParsed = {};

        this.subscription1 = this.transTypesService.selectedCompanyTransTypes
            .pipe(takeUntil(this.destroyed1$))
            .subscribe((rslt) => this.onCompanyTransTypesArrive(rslt));

        this.editMovementData = {
            visible1: 0,
            visible: false,
            title: '',
            form: new FormGroup({}),
            source: null,
            seriesSource: null,
            loading: null
        };
    }

    get maxSizeHeightModal() {
        return window.innerHeight - 300;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.rebuildMessagesSource();
    }

    trackByFileId(index: number, row: any): string {
        return row.fileId;
    }

    ngOnDestroy(): void {
        if (this.actionDoneSub) {
            this.actionDoneSub.unsubscribe();
        }
        this.destroyed$.next();
        this.destroyed$.complete();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.destroyed1$.next();
        this.destroyed1$.complete();
        if (this.subscription1) {
            this.subscription1.unsubscribe();
        }
    }

    private showupEditMovementDataDialog(parameters: any): void {
        combineLatest(
     [
         this.sharedService.cashFlowDetails(parameters.params),
         this.sharedService.paymentTypesTranslate$
     ]
        ).subscribe(
            {
                next: ([response, paymentTypesTranslate]: any) => {
                    const rowInfo = response['body'].cashFlowDetails.filter(
                        (it) => it.transId === parameters.keyId
                    );
                    if (rowInfo.length) {
                        if (parameters.isSetDate) {
                            rowInfo[0].originalDate = this.userService.appData
                                .moment()
                                .add(30, 'days')
                                .valueOf();
                        }
                        this.editOperation(
                            this.setupTransItemView(rowInfo[0], paymentTypesTranslate),
                            EditingType.Single,
                            !parameters.isSetDate
                        );
                    }
                },
                error: (err: HttpErrorResponse) => {
                    if (err.error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            }
        );
    }

    private rebuildMessagesSource() {
        if (!this.messages$) {
            this.messagesSource$ = null;
            this.messagesSeparatedNew$ = null;
            this.messagesSeparatedOld$ = null;
            return;
        }

        this.messagesSource$ = combineLatest(
            [
                this.messages$,
                this.filter.valueChanges.pipe(
                    startWith(this.filter.value) // ,
                    // distinctUntilChanged((prev, curr) => {
                    //     return prev === curr || (prev && prev.severity === curr.severity);
                    // })
                ),
                this.msgEditPerformed
            ]
        ).pipe(
            map(([rslt, filter]: any) => {
                const msgsPrepared = (
                    !Array.isArray(rslt) ? [] : [].concat(...rslt)
                ).filter(
                    (msg) =>
                        (!msg.indHide && !filter.severity) ||
                        msg.indAlert === filter.severity
                );

                msgsPrepared.sort((a, b) => {
                    return (
                        b.dateCreated - a.dateCreated ||
                        (b.indNew ? 1 : 0) - (a.indNew ? 1 : 0) ||
                        (b.indRead ? 1 : 0) - (a.indRead ? 1 : 0)
                    );
                });

                return msgsPrepared;
            }),
            tap((msgsPrepared: Array<Message>) => {
                msgsPrepared
                    .filter(
                        (msg) => msg.linked_text && !(msg.messageId in this.messagesParsed)
                    )
                    .forEach((msg) => {
                        if (
                            !(
                                msg.linked_action === 'getTransHistory' &&
                                this.userService.appData.userData.companySelect.lite
                            )
                        ) {
                            const regex = this.toRegExp(msg.linked_text);
                            this.messagesParsed[msg.messageId] =
                                this._sanitizer.bypassSecurityTrustHtml(
                                    msg.messageTemplate.replace(
                                        regex,
                                        '<button class="button-link linked_text">' +
                                        msg.linked_text +
                                        '</button>'
                                    )
                                );
                        }
                    });

                if (
                    !this.filter.get('severity').value &&
                    !msgsPrepared.length &&
                    this.filter.enabled
                ) {
                    this.filter.disable();
                } else if (
                    (this.filter.get('severity').value || msgsPrepared.length) &&
                    this.filter.disabled
                ) {
                    this.filter.enable();
                }
            }),
            publishRef
        );

        this.messagesSeparatedNew$ = this.messagesSource$.pipe(
            map((rslt) => {
                return rslt.filter(
                    (msg) => msg.indNew === true
                    // || (msg.dateCreated > +this.messageIsNewIfAfter)
                );
            })
        );

        this.messagesSeparatedOld$ = this.messagesSource$.pipe(
            map((rslt) => {
                return rslt.filter(
                    (msg) => msg.indNew !== true
                    // || (msg.dateCreated <= +this.messageIsNewIfAfter)
                );
            })
        );

        this.actionDoneSub = this.actionService.isAfterDidAction$.subscribe(() => {
            this.messagesSideShow.emit();
        });
    }

    msgTrack(idx: any, msg: any): any {
        return msg.messageId;
    }

    private toRegExp(text: string): RegExp {
        if (!text) {
            return null;
        }
        return new RegExp(text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    }

    messageHide(msg: Message) {
        this.messageService
            .updateMessagesState({
                indHide: true,
                messageIds: [msg.messageId]
            })
            .subscribe((resp) => {
                if (resp && !resp.error) {
                    msg.indHide = true;
                    this.msgEditPerformed.next(null);
                }
            });
    }

    messageToggleRead(msg: Message) {
        this.messageService
            .updateMessagesState({
                indRead: !msg.indRead,
                messageIds: [msg.messageId]
            })
            .subscribe((resp) => {
                if (resp && !resp.error) {
                    msg.indRead = !msg.indRead;
                }
            });
    }

    messagesMarkAllAsRead() {
        this.messagesSource$
            .pipe(
                switchMap((msgs) => {
                    return this.messageService.updateMessagesState({
                        indRead: true,
                        messageIds: msgs.map((msg) => msg.messageId)
                    });
                })
            )
            .subscribe((resp) => {
                if (resp && !resp.error) {
                    this.messagesSource$.subscribe((msgs) => {
                        msgs.forEach((msg) => (msg.indRead = true));
                    });
                }
            });
    }

    messageClick(msg: Message, evt: Event) {
        if (
            evt.target instanceof HTMLElement &&
            (evt.target as HTMLElement).classList.contains('linked_text')
        ) {
            // console.log('!!!!! messageLinkClick -> %o', msg);
            this.messageActionClick(msg, 'linked_action');
        } else {
            if (!msg.indRead) {
                this.messageToggleRead(msg);
            }
        }
    }

    messageActionClick(msg: any, fldName: string) {
        console.log(
            '!!!!! messageActionClick -> msg: %o, field:%o, action: %o',
            msg,
            fldName,
            msg[fldName]
        );
        if (!msg.indRead) {
            this.messageToggleRead(msg);
        }

        if (
            msg[fldName] === 'updateNonCyclicTransaction' ||
            msg[fldName] === 'updateTazrimTransaction'
        ) {
            const parameters: any = {
                companyAccountIds: [msg.companyAccountId],
                companyId: this.userService.appData.userData.companySelect.companyId,
                dateFrom: this.userService.appData
                    .moment(this.userService.appData.moment().valueOf())
                    .toISOString(),
                dateTill: this.userService.appData
                    .moment(this.userService.appData.moment().add(30, 'days').valueOf())
                    .toISOString(),
                expence: -1
            };
            this.showupEditMovementDataDialog({
                params: parameters,
                keyId: msg.keyId,
                isSetDate: msg[fldName] === 'updateNonCyclicTransaction'
            });
        }
        if (fldName !== 'popUpFile') {
            this.actionService.doUsingMessage(
                msg[fldName],
                msg,
                this.sharedComponent
            );
        } else {
            this.getMessageFiles = {
                title:
                    msg.messageTemplate.split(' ')[0] +
                    ' ' +
                    msg.messageTemplate.split(' ')[1],
                msg: msg,
                messageFiles: false,
                messageFilesChecked: []
            };
            this.messageService
                .getMessageFiles({
                    processId: msg.keyId
                })
                .subscribe((resp) => {
                    if (resp && !resp.error) {
                        this.getMessageFiles.messageFiles = resp['body'];

                        // const aaa = [{
                        //     'fileId': '2a1d4c44-73b2-46bf-8e57-d5000832f4c6',
                        //     'fileStatus': 'WAIT_FOR_CONFIRM',
                        //     'fileName': 'AE398048-CBAC-4C43-9CA5-EF62DED8B845_ea193d9f-46d9-4488-ba47-a650808191bf.jpg',
                        //     'fileLocation': 'טאב לאישור',
                        //     'folderName': null,
                        //     'companyName': 'בדיקות ייצוא',
                        //     'pages': [{
                        //         'contentUrl': 'https://bb-ng-docs-dev.s3.eu-west-1.amazonaws.com/2a1d4c44-73b2-46bf-8e57-d5000832f4c6.jpg?X-Amz-Security-Token=IQoJb3JpZ2luX2VjED4aCWV1LXdlc3QtMSJIMEYCIQCYWkkex5FRxXwPdY7LLvvqEeNNN%2BHHr8Coovm%2BmZrPnAIhANWcxBu2QAMJWnJP3Ly%2BcecpYa%2Fb0CSl6%2BlJYs0Cfb14KtsECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQARoMODEzNjI2MzE4NjIxIgyOCpFy0LeBetjTIsYqrwSVNspfMq3bGjlEJTyfYf6SU6McHcBqHmsKdsgTxLcQuPbs9IC5DYUxaJVGu81iF%2FR2uldfEf89J4OlK3LygofSJFk91EcsHC81t51MNt89zYixCUuXveaIjZRDX1Ag7PIVV9rIjkyWXKaRlEtRJcYwIv7l7aPrpPgZIDUmXUF5iyL%2B8yR06kQ%2BJ0aR3HTXEpk4KXcMoHJtab9K%2BtBdAnnxZvqphvmQFvJbAfoG4M6FKz5w1z5P3TEJ8Xjaobfc1jCA8dgghV2HwEkS1x1VQR3sYgo%2BQkx%2Fysh9kBE18%2B5rVwueO%2BJBLeoWQhNy0GEiJ4F%2FtfiAwDwvlwAWM15qaBDgVOF3Icu%2BWw%2B66T2AnX%2FoxI3YJPBDZkLaXHg5m0OGi91bFCpdHtauv33Pj4QQIx9ebGjuHiRsgVLaXDLpeJqEwchn7Egb9o1sQ40cZqkMKGPT5djPPoc%2B3V%2B3s%2FD94%2FBK1HVyCHgink7M6wcL4ZJweseTgolg2AS%2BbPFbc02w%2BwtUE8EYTYZs64fYMvzwsOMu21VU8hOHemkpKAOc%2BmCCdWnpyJ0ASC4ftDc%2F0P%2BwveleWYgDitBIrgR7p0hwkoY0sdmr5JH1S%2BJSE8sxeyigS7MyZbg%2FVxuhI2LlMBJa7VXFA089427gVZRSkizn1U5Q6edovRwGV1aPBZ5Ut%2FnxkuE14DzZNMKpa2m7xHZzYSl7f8zziTMsmBVSNTkG%2FU%2F%2B4G30FmbKVovUxNCGrT6VMODx45cGOqgBmP%2F5oO5fhr0lPFsFylxlr%2Ble2DBh0MqzMR2pb%2BXsnKtx%2BI1ob360IjIiMMCJyey9kzBzlMXCOQHOTItsdH1O5w2kLesP7nBA1OVRSRwQjTWxE0IM9pHgXoY0nipGRvn%2FQsMcjZcCCjAniqkFEGILqgGRRtQnQFIYrN7B4N1OForCW7w0ecgBtha2t%2BXUw8bD%2FQR23Av2eK4RKOzT5Kj%2F9If3sefBiKqC&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220814T145736Z&X-Amz-SignedHeaders=host&X-Amz-Expires=180&X-Amz-Credential=ASIA3237IL4OTEETYO4B%2F20220814%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Signature=9bcdbe339dbaa87a8c71d265c0542695c6c37c32df307902f892cac2b1ade5ea',
                        //         'visionResultUrl': 'https://bb-ng-json-dev.s3.eu-west-1.amazonaws.com/2a1d4c44-73b2-46bf-8e57-d5000832f4c6.min.json?X-Amz-Security-Token=IQoJb3JpZ2luX2VjED4aCWV1LXdlc3QtMSJIMEYCIQCYWkkex5FRxXwPdY7LLvvqEeNNN%2BHHr8Coovm%2BmZrPnAIhANWcxBu2QAMJWnJP3Ly%2BcecpYa%2Fb0CSl6%2BlJYs0Cfb14KtsECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQARoMODEzNjI2MzE4NjIxIgyOCpFy0LeBetjTIsYqrwSVNspfMq3bGjlEJTyfYf6SU6McHcBqHmsKdsgTxLcQuPbs9IC5DYUxaJVGu81iF%2FR2uldfEf89J4OlK3LygofSJFk91EcsHC81t51MNt89zYixCUuXveaIjZRDX1Ag7PIVV9rIjkyWXKaRlEtRJcYwIv7l7aPrpPgZIDUmXUF5iyL%2B8yR06kQ%2BJ0aR3HTXEpk4KXcMoHJtab9K%2BtBdAnnxZvqphvmQFvJbAfoG4M6FKz5w1z5P3TEJ8Xjaobfc1jCA8dgghV2HwEkS1x1VQR3sYgo%2BQkx%2Fysh9kBE18%2B5rVwueO%2BJBLeoWQhNy0GEiJ4F%2FtfiAwDwvlwAWM15qaBDgVOF3Icu%2BWw%2B66T2AnX%2FoxI3YJPBDZkLaXHg5m0OGi91bFCpdHtauv33Pj4QQIx9ebGjuHiRsgVLaXDLpeJqEwchn7Egb9o1sQ40cZqkMKGPT5djPPoc%2B3V%2B3s%2FD94%2FBK1HVyCHgink7M6wcL4ZJweseTgolg2AS%2BbPFbc02w%2BwtUE8EYTYZs64fYMvzwsOMu21VU8hOHemkpKAOc%2BmCCdWnpyJ0ASC4ftDc%2F0P%2BwveleWYgDitBIrgR7p0hwkoY0sdmr5JH1S%2BJSE8sxeyigS7MyZbg%2FVxuhI2LlMBJa7VXFA089427gVZRSkizn1U5Q6edovRwGV1aPBZ5Ut%2FnxkuE14DzZNMKpa2m7xHZzYSl7f8zziTMsmBVSNTkG%2FU%2F%2B4G30FmbKVovUxNCGrT6VMODx45cGOqgBmP%2F5oO5fhr0lPFsFylxlr%2Ble2DBh0MqzMR2pb%2BXsnKtx%2BI1ob360IjIiMMCJyey9kzBzlMXCOQHOTItsdH1O5w2kLesP7nBA1OVRSRwQjTWxE0IM9pHgXoY0nipGRvn%2FQsMcjZcCCjAniqkFEGILqgGRRtQnQFIYrN7B4N1OForCW7w0ecgBtha2t%2BXUw8bD%2FQR23Av2eK4RKOzT5Kj%2F9If3sefBiKqC&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220814T145736Z&X-Amz-SignedHeaders=host&X-Amz-Expires=180&X-Amz-Credential=ASIA3237IL4OTEETYO4B%2F20220814%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Signature=20cfb0a220ffd3534f0d0b26463bb6c8c25026ce91b138828b1a16d8a2dbb45f',
                        //         'fileId': '2a1d4c44-73b2-46bf-8e57-d5000832f4c6'
                        //     }],
                        //     'companyChanged': false
                        // }];
                    }
                });
        }
    }

    showDocumentStorageDataViewQuick(file: any): void {
        this.showDocumentStorageDataFired = true;
        this.sidebarImgs = file;
    }

    rotateInside() {
        if (this.degRotateImg === 0) {
            this.degRotateImg = 90;
        } else if (this.degRotateImg === 90) {
            this.degRotateImg = 180;
        } else if (this.degRotateImg === 180) {
            this.degRotateImg = 270;
        } else if (this.degRotateImg === 270) {
            this.degRotateImg = 0;
        } else {
            this.degRotateImg = 0;
        }
    }

    zoomStepInside(direction: number, type: string) {
        const newImageScale: any = this[type] + 0.1 * Math.sign(direction);
        // if (newImageScale > 1.6 || newImageScale < 0.2) {
        //     return;
        // }
        this[type] = newImageScale;
    }

    hideDocumentStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentStorageDataFired = false;
        this.sidebarImgs = false;
        console.log('hideDocumentStorageData');
    }

    checkSelected() {
        this.getMessageFiles.messageFilesChecked =
            this.getMessageFiles.messageFiles.filter((fd) => fd.selcetFile);
    }

    filesUnion() {
        this.reportService.postponed = {
            action: this.sharedService.filesUnion({
                fileIds: this.getMessageFiles.messageFilesChecked.map(
                    (file) => file.fileId
                )
            }),
            message: this._sanitizer.bypassSecurityTrustHtml(
                'המסמכים שאוחדו נמצאים בתהליך עיבוד, נעדכן שהאיחוד יסתיים'
            ),
            fired: false
        };
        timer(3000)
            .pipe(
                switchMap(() => {
                    if (
                        this.reportService.postponed &&
                        this.reportService.postponed.action
                    ) {
                        return this.reportService.postponed.action;
                    } else {
                        return EMPTY;
                    }
                }),
                tap(() => {
                    this.reportService.postponed.fired = true;
                }),
                take(1)
            )
            .subscribe(() => {
                this.getMessageFiles = false;
            });
    }

    filesSplit() {
        const pagesContainer: any = [];
        this.getMessageFiles.messageFilesChecked[0].pages.forEach((page, idx) => {
            pagesContainer.push([page.fileId]);
        });
        this.ocrService
            .filesSplit({
                childrenIdsLists: pagesContainer,
                fileId: this.getMessageFiles.messageFilesChecked[0].fileId
            })
            .subscribe(() => {
                this.getMessageFiles = false;
            });
    }

    onApproveDeleteOperation(item: any): void {
        this.processingDeleteOperation = true;
        this.restCommonService
            .deleteOperation({
                params: {
                    companyAccountId: item.companyAccountId,
                    transId: item.keyId,
                    dateFrom: item.dateFrom
                },
                editType: EditingType.Single,
                operationType: item.keyType
            })
            .subscribe(([succeeded, failed]: any) => {
                this.messageService
                    .updateMessagesState({
                        indHide: true,
                        indRead: true,
                        messageIds: [item.messageId]
                    })
                    .subscribe((resp) => {
                        this.processingDeleteOperation = false;
                        if (resp && !resp.error) {
                            item.indHide = true;
                            this.msgEditPerformed.next(null);
                        }
                    });
            });
    }

    private onCompanyTransTypesArrive(rslt: any[]) {
        this.companyTransTypes = rslt;
        this.defaultTransType = this.companyTransTypes
            ? this.companyTransTypes.find((tt) => {
                return tt.transTypeId === this.DEFAULT_TRANSTYPE_ID;
            })
            : null;
    }

    public isEdit(item: any, isEdit: boolean): void {
        if (isEdit) {
            if (item.unionId && item.targetType === 'CYCLIC_TRANS') {
                item.transDateFullEdit =
                    item.accountEdit =
                        item.transNameEdit =
                            item.paymentDescEdit =
                                item.selectedTransTypeEdit =
                                    item.asmachtaEdit =
                                        item.totalEdit =
                                            false;
                return;
            }

            item.transDateFullEdit =
                item.canChangeZefi &&
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'BANK_CHEQUE' ||
                    item.targetType === 'ERP_CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    item.targetType === 'CYCLIC_TRANS' ||
                    item.targetType === 'DIRECTD');

            item.accountEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'ERP_CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER';

            item.transNameEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'BANK_CHEQUE' ||
                item.targetType === 'ERP_CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'BANK_TRANS' ||
                // || item.targetType === 'SOLEK_TAZRIM'
                item.targetType === 'CCARD_TAZRIM' ||
                item.targetType === 'LOAN_TAZRIM';

            item.paymentDescEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'CYCLIC_TRANS';

            item.selectedTransTypeEdit =
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'BANK_CHEQUE' ||
                    item.targetType === 'ERP_CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    item.targetType === 'BANK_TRANS' ||
                    item.targetType === 'SOLEK_TAZRIM' ||
                    item.targetType === 'CCARD_TAZRIM' ||
                    item.targetType === 'LOAN_TAZRIM') &&
                !(
                    item.linkId && item.linkId !== '00000000-0000-0000-0000-000000000000'
                ) &&
                !(
                    item.pictureLink &&
                    item.pictureLink !== '00000000-0000-0000-0000-000000000000'
                );
            // && (!!item.biziboxMutavId
            //     ? !item.linkId || item.linkId !== '00000000-0000-0000-0000-000000000000'
            //     : true);
            item.asmachtaEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'CYCLIC_TRANS';

            item.totalEdit =
                item.canChangeZefi &&
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    (item.targetType === 'SOLEK_TAZRIM' && !item.unionId) ||
                    item.targetType === 'CCARD_TAZRIM' ||
                    item.targetType === 'CYCLIC_TRANS' ||
                    item.targetType === 'DIRECTD' ||
                    item.targetType === 'CASH');
        } else {
            item.transDateFullEdit = isEdit;
            item.accountEdit = isEdit;
            item.transNameEdit = isEdit;
            item.paymentDescEdit = isEdit;
            item.selectedTransTypeEdit = isEdit;
            item.asmachtaEdit = isEdit;
            item.totalEdit = isEdit;
        }
    }

    private setupTransItemView(
        trns: any,
        paymentTypesTranslate: { [k: string]: string }
    ): any {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.companyAccountId
        );

        const companyTransType =
            this.companyTransTypes.find((tt) => {
                return tt.transTypeId === trns.transTypeId;
            }) || this.defaultTransType;

        this.isEdit(trns, false);

        if ((trns.asmachta && trns.asmachta === 'null') || trns.asmachta === '0') {
            trns.asmachta = null;
        }

        return Object.assign(trns, {
            account: trnsAcc,
            transDateFull: new Date(trns.transDate),
            accountNickname: trnsAcc ? trnsAcc.accountNickname : null,
            paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
            transTypeName: companyTransType
                ? companyTransType.transTypeName
                : this.translate.instant('expressions.noTransType'),
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy'),
            selectedTransType: companyTransType,
            originalDateFull: Number.isFinite(trns.originalDate)
                ? new Date(trns.originalDate)
                : null,
            transTypeEditable:
                !(
                    trns.linkId && trns.linkId !== '00000000-0000-0000-0000-000000000000'
                ) &&
                (trns.targetType === 'CHEQUE' ||
                    trns.targetType === 'BANK_CHEQUE' ||
                    trns.targetType === 'ERP_CHEQUE' ||
                    trns.targetType === 'OTHER' ||
                    trns.targetType === 'WIRE_TRANSFER' ||
                    trns.targetType === 'BANK_TRANS' ||
                    trns.targetType === 'SOLEK_TAZRIM' ||
                    trns.targetType === 'CCARD_TAZRIM' ||
                    trns.targetType === 'LOAN_TAZRIM') &&
                !(
                    trns.paymentDesc === 'Checks' &&
                    trns.pictureLink !== null &&
                    trns.pictureLink !== '00000000-0000-0000-0000-000000000000'
                )
        });
    }

    onSubmitEditOperation(): void {
        if (!this.editMovementData.form.valid) {
            BrowserService.flattenControls(this.editMovementData.form).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        const dataToSubmit = this.editEditor.result;
        this.editMovementData.loading = true;
        this.sharedService
            .updateCyclicTransaction(
                this.editEditor.mode,
                this.editMovementData.source.targetType,
                dataToSubmit
            )
            .subscribe((rslt) => {
                console.log('submit finished! got %o', rslt);
                this.editMovementData.loading = false;
                if (!rslt.error) {
                    this.editEditor.reset();
                    this.editMovementData = {
                        visible1: 0,
                        visible: false,
                        title: '',
                        form: new FormGroup({}),
                        source: null,
                        seriesSource: null,
                        loading: null
                    };
                }
            });

        // console.log('submit called! got %o', dataToSubmit);
    }

    editOperation(
        item: any,
        editType: EditingType = EditingType.Single,
        isFocusOnAsmachta?: boolean
    ): void {
        // debugger
        this.editMovementData.visible = true;
        this.editMovementData.title =
            this.translate.instant('formFixedMovement.editTitle', {
                movementType: this.isPeriodicType.transform(item.targetType)
                    ? item.expence === true
                        ? this.translate.instant('actions.addFixedExpense')
                        : this.translate.instant('actions.addFixedIncome')
                    : item.expence === true
                        ? this.translate.instant('titles.expectedExpense')
                        : this.translate.instant('titles.expectedIncome')
            }) +
            ' - ' +
            item.paymentDescTranslate; // + this.translate.instant('paymentTypes.' + item.paymentDesc);
        this.editMovementData.form = new FormGroup({});

        this.editMovementData.source = JSON.parse(JSON.stringify(item));
        // if (item.transDate) {
        //     this.editMovementData.source.transDate = new Date(item.transDate);
        // }
        delete this.editMovementData.source.account;

        this.editMovementData.seriesSource = null;
        this.editEditor.mode = editType;
        this.editMovementData.loading = false;

        if (isFocusOnAsmachta) {
            setTimeout(() => {
                // @ts-ignore
                const asmachta = Object.values(this.editEditorElem.nativeElement).find(
                    (key) => key['id'] && key['id'] === 'asmachta'
                );
                if (asmachta) {
                    // @ts-ignore
                    asmachta.focus();
                }
            }, 500);
        }

        if (
            this.isPeriodicType.transform(this.editMovementData.source.targetType)
        ) {
            // if (['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM', 'CYCLIC_TRANS'].includes(this.editMovementData.source.targetType)) {
            this.editMovementData.loading = true;

            combineLatest(
     [
         this.sharedService.getCyclicTransactionSingle(
             JSON.parse(JSON.stringify(item))
         ),
         this.editMovementData.source.targetType === 'CYCLIC_TRANS' &&
         this.editMovementData.source.unionId &&
         !Array.isArray(this.editMovementData.source.mutavArray)
             ? this.sharedService.getUnionBankdetail({
                 companyId:
                 this.userService.appData.userData.companySelect.companyId,
                 dateFrom:
                     this.editMovementData.source.kvuaDateFrom ||
                     this.editMovementData.source.transDate,
                 transId: this.editMovementData.source.transId
             })
             : of(null)
     ]
            ).subscribe(([rslt, unionDataRslt]: any) => {
                this.editMovementData.loading = false;
                if (
                    !rslt.error &&
                    rslt.body &&
                    Array.isArray(rslt.body.transes) &&
                    rslt.body.transes.length > 0
                ) {
                    this.editMovementData.seriesSource = Object.assign(
                        rslt.body.transes[0],
                        {
                            paymentDesc: item.paymentDesc
                        }
                    );
                }
                if (
                    unionDataRslt &&
                    !unionDataRslt.error &&
                    Array.isArray(unionDataRslt.body)
                ) {
                    this.editMovementData.source = Object.assign(
                        JSON.parse(JSON.stringify(item)),
                        {
                            mutavArray: unionDataRslt.body
                        }
                    );
                }
            });
        }

        setTimeout(() => this.editMovementDataDlg.center());
    }
}
