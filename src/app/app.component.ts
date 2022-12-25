import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    NgZone,
    OnDestroy,
    OnInit,
    Renderer2,
    SecurityContext,
    Testability
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from './core/user.service';
import {AuthService} from './login/auth.service';
import {BrowserService} from './shared/services/browser.service';
import {DomSanitizer, SafeValue} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {AdminService} from './admin/admin.service';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {MatIconRegistry} from '@angular/material/icon';
import {Angulartics2GoogleAnalytics} from 'angulartics2';
import {PrimeNGConfig} from 'primeng/api';

import {NewVersionAvailablePromptComponent} from './shared/component/new-version-available-prompt/new-version-available-prompt.component';
import {DomHandler} from 'primeng/dom';

DomHandler.absolutePosition = function (element: any, target: any) {
    const elementDimensions = element.offsetParent ? {
        width: element.offsetWidth,
        height: element.offsetHeight
    } : this.getHiddenElementDimensions(element);
    const elementOuterHeight = elementDimensions.height;
    const elementOuterWidth = elementDimensions.width;
    const targetOuterHeight = target.offsetHeight;
    const targetOuterWidth = target.offsetWidth;
    const targetOffset = target.getBoundingClientRect();

    const windowScrollTop = this.getWindowScrollTop();
    const windowScrollLeft = this.getWindowScrollLeft();
    const viewport = this.getViewport();
    let top: number, left: number;
    if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
        top = targetOffset.top + windowScrollTop - elementOuterHeight;
        element.style.transformOrigin = 'bottom';

        if (top < 0) {
            top = windowScrollTop;
        }
    } else {
        top = targetOuterHeight + targetOffset.top + windowScrollTop;
        element.style.transformOrigin = 'top';
    }

    if (targetOffset.left + elementOuterWidth > viewport.width) {
        // left = targetOffset.left + windowScrollLeft;
        left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
    } else {
        left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
    }

    element.style.top = top + 'px';
    element.style.left = left + 'px';
};
DomHandler.relativePosition = function (element: any, target: any) {
    const getClosestRelativeElement = (el) => {
        if (!el) {
            return;
        }

        return getComputedStyle(el).getPropertyValue('position') === 'relative' ? el : getClosestRelativeElement(el.parentElement);
    };

    const elementDimensions = element.offsetParent ? {
        width: element.offsetWidth,
        height: element.offsetHeight
    } : this.getHiddenElementDimensions(element);
    const targetHeight = target.offsetHeight;
    const targetOffset = target.getBoundingClientRect();
    const windowScrollTop = this.getWindowScrollTop();
    const windowScrollLeft = this.getWindowScrollLeft();
    const viewport = this.getViewport();
    const relativeElement = getClosestRelativeElement(element);
    const relativeElementOffset = relativeElement?.getBoundingClientRect() || {
        top: -1 * windowScrollTop,
        left: -1 * windowScrollLeft
    };
    let top: number, left: number;

    if (targetOffset.top + targetHeight + elementDimensions.height > viewport.height) {
        top = targetOffset.top - relativeElementOffset.top - elementDimensions.height;
        element.style.transformOrigin = 'bottom';
        if (targetOffset.top + top < 0) {
            top = -1 * targetOffset.top;
        }
    } else {
        top = targetHeight + targetOffset.top - relativeElementOffset.top;
        element.style.transformOrigin = 'top';
    }

    if (elementDimensions.width > viewport.width) {
        // element wider then viewport and cannot fit on screen (align at left side of viewport)
        left = (targetOffset.left - relativeElementOffset.left) * -1;
    } else if (targetOffset.left - relativeElementOffset.left + elementDimensions.width > viewport.width) {
        // element wider then viewport but can be fit on screen (align at right side of viewport)
        left = (targetOffset.left - relativeElementOffset.left + elementDimensions.width - viewport.width) * -1;
    } else {
        // element fits on screen (align with target)
        left = targetOffset.left - relativeElementOffset.left;
    }

    element.style.top = top + 'px';
    element.style.right = left + 'px';
};

@Component({
    selector: 'app-root',
    template: `
        <div [class.p-rtl]="userService?.appData?.dir === 'rtl'"
             [dir]="userService['appData']['dir']"
             [ngClass]="{
        isLTR: userService?.appData?.dir === 'ltr',
        isRTL: userService?.appData?.dir === 'rtl'
      }"
        >
<!--            <p-dialog [(visible)]="networkDisconnect" [closable]="false" [draggable]="false" [modal]="true"-->
<!--                      [resizable]="false" [rtl]="true" [style]="{width: '50vw', height: '393px'}" appendTo="body"-->
<!--                      header="אינכם מחוברים לרשת!"-->
<!--                      styleClass="networkDisconnect">-->
<!--                <div>-->
<!--                    <i class="fa fa-solid fa-wifi" style="font-size: 100px;margin-bottom: 30px;"></i>-->
<!--                </div>-->

<!--                <div>-->
<!--                    אנא התחברו לרשת על מנת להמשיך לגלוש בממשק-->
<!--                </div>-->
<!--            </p-dialog>-->
            <router-outlet></router-outlet>
        </div>
    `
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
    public currentLang: string;
    public networkDisconnect: boolean = false;
    private stableSubscribe: Subscription;
    selfClick: boolean = false;

    // private viewportHandler: any;
    documentClickListener: any;
    target: any;

    constructor(
        public translate: TranslateService,
        public angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
        public userService: UserService,
        public authService: AuthService,
        private _sanitizer: DomSanitizer,
        private renderer: Renderer2,
        private browserDetect: BrowserService,
        private ngZone: NgZone,
        private el: ElementRef,
        private ref: ChangeDetectorRef,
        private testability: Testability,
        private router: Router,
        private adminService: AdminService,
        public snackBar: MatSnackBar,
        private matIconRegistry: MatIconRegistry,
        private config: PrimeNGConfig
    ) {
        // if (navigator.connection) {
        //     if (navigator.connection.rtt === 0) {
        //         this.networkDisconnect = true;
        //     }
        //     const changeHandler = (e: Event) => {
        //         console.log('networkDisconnect-----', e);
        //         if (e.currentTarget['rtt'] === 0) {
        //             this.networkDisconnect = true;
        //         } else {
        //             this.networkDisconnect = false;
        //         }
        //     };
        //     navigator.connection.onchange = changeHandler;
        // }

        // this.config.overlayOptions.onAnimationStart = ((event:any) => {
        //     debugger
        //     if (event.toState === 'open') {
        //         this.bindDocumentHoverListener();
        //     }
        // })
        // this.config.overlayOptions.onAnimationDone = ((event:any) => {
        //     debugger
        //     if (event.toState === 'close') {
        //         this.unbindDocumentClickListener();
        //     }
        // })
        // this.ngZone.runOutsideAngular(() => {
        //     let documentEvent = DomHandler.isIOS() ? 'touchstart' : 'mouseover';
        //     const documentTarget: any = this.el ? this.el.nativeElement.ownerDocument : 'document';
        //     this.documentClickListener = this.renderer.listen(documentTarget, documentEvent, (event) => {
        //
        //        if(this.userService.appData.overlay.length){
        //            this.userService.appData.overlay.forEach(it=>{
        //                if (!it.container.contains(event.target) && it.target !== event.target && !it.target.contains(event.target) && !this.selfClick) {
        //                    this.ngZone.run(() => {
        //                        console.log('hide', event, it.container, it.item)
        //                        it.item.hide();
        //                    });
        //                }
        //            })
        //
        //        }
        //
        //         this.selfClick = false;
        //         this.ref.markForCheck();
        //     });
        // });
        angulartics2GoogleAnalytics.startTracking();
        this.config.ripple = true;
        // this.config.overlayOptions = {
        //     appendTo: 'body',
        //     onAnimationStart: event => {
        //         debugger
        //     }
        // };

        if (
            window.location.host.includes('dev') ||
            window.location.host.includes('localhost')
        ) {
            this.userService.appData.isDev = true;
        } else {
            this.userService.appData.isDev = false;
        }
        this.renderer.addClass(document.body, this.browserDetect.browserDetect.OS);
        this.renderer.addClass(
            document.body,
            this.browserDetect.browserDetect.browser
        );

        if (this.browserDetect.browserDetect.version !== 'an unknown version') {
            this.renderer.addClass(
                document.body,
                this.browserDetect.browserDetect.version
            );
        }
        this.userService.appData.popUpShow = false;
        this.initTranslate();
        this.authService.langEvent.subscribe((value) => {
            this.changeDir(value.lang);
        });
        // override the sanitize method so that it returns an empty string instead of null so that IE doesn't show "null" in the DOM
        // _sanitizer.sanitize = function (
        //     context: SecurityContext,
        //     value: SafeValue | string | null
        // ) {
        //     return (
        //         (_sanitizer as any).__proto__.sanitize.call(
        //             _sanitizer as any,
        //             context,
        //             value
        //         ) || ''
        //     );
        // };
        this.matIconRegistry.addSvgIcon(
            'bizibox_visibility_button',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/visibility-button.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_visibility',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/visibility.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_visibility_off',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/visibility_off.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_download',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/download.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'export2',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/export2.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'interface',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/interface.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'swap',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/swap.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_archive',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/box8.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_flag',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/flag.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_flag_outline',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/flag-outline.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'descending_sort',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/descending-sort.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'ascending_sort',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/ascending-sort.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bizibox_merge',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/merge.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'activation_false',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/activation-false.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'flag',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/flag.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'flagBg',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/flagBg.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'note',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/note.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'noteBg',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/noteBg.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'picture',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/picture.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'print',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/printIcon.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'trash',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/trash.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'settingsNav',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/settingsNav.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'reportNav',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/reportNav.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'journalTransNav',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/journalTrans.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bankExportNav',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/bankExport.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'companiesNav',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/companiesNav.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'bagNav',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/bagNav.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'mainNav',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/mainNav.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'pictureLines',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/pictureLines.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'clipOutline',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/clipOutline.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'tick',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/tick.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'file',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/file.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'arrowBack',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/arrowBack.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'arrowBackNew',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/arrowBackNew.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'closeIcon',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/closeIcon.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'sort_asc',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/sort-asc.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'sort_desc',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/sort-desc.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'sort_unordered',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/sort-unordered.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'folderLine',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/folderLine.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'mail',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/mail.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'user',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/user.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'user_bg',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/userBg.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'uploadSource_BIZIBOX_FOLDER',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/uploadSourceIcons/BIZIBOX_FOLDER.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'uploadSource_MAIL',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/uploadSourceIcons/MAIL.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'uploadSource_MOBILE',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/uploadSourceIcons/MOBILE.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'uploadSource_SCAN',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/uploadSourceIcons/SCAN.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'uploadSource_UPLOAD',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/uploadSourceIcons/UPLOAD.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'change_name_folder',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/changeNameFolder.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'transferToAnotherFolder',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/transferToAnotherFolder.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'lock-close',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/lock.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'lock-open',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/open.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'send',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/send.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'box',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/box.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'reloadRotate',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/reloadRotate.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'reload',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/reload.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'scissors',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/scissors.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'calendar',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/calendar.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'folder-table',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/folder-table.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'close',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/close.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'confirm',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/confirm.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'mailsend',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/mailsend.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'message',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/message.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'whatsapp',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/whatsapp.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'custId',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/custId.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'doc',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/doc.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'RECHECK',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/RECHECK.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'addPettyCash',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/addPettyCash.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'document',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/document.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'deleteInvoice',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/deleteInvoice.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'pencil',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/pencil.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'rotate',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/reload2.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'picIcon',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/picIcon.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'refresh',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/refresh.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'cancel',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/cancel.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'check-solid',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/check-solid.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'check-double-solid',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/check-double-solid.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'refresh-office-users',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/refresh-office-users.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'snowflake-office-users',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/snowflake-office-users.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'swap-office-users',
            _sanitizer.bypassSecurityTrustResourceUrl(
                '../assets/images/swap-office-users.svg'
            )
        );
        this.matIconRegistry.addSvgIcon(
            'copy',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/copy.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'bar',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/bar.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'chart',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/chart.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'leftBtnArr',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/leftBtnArr.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'leftBtnArrActive',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/leftBtnArrActive.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'rightBtnArr',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/rightBtnArr.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'rightBtnArrActive',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/rightBtnArrActive.svg')
        );


        this.matIconRegistry.addSvgIcon(
            'BankTransferMulti',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/BankTransferMulti.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'otherCredit',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/otherCredit.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Slika',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Slika.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'ChecksMulti',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/ChecksMulti.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Bankfees',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Bankfees.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'credit',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/credit.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Deposits',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Deposits.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Other',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Other.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'BankTransfer',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/BankTransfer.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'standingOrder',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/standingOrder.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Loans',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Loans.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Bouncedcheck',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Bouncedcheck.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'Checks',
            _sanitizer.bypassSecurityTrustResourceUrl('../assets/images/Checks.svg')
        );
    }

    public initTranslate(): void {
        this.translate.addLangs(['ENG', 'HEB']);
        this.translate.setDefaultLang('HEB');
        this.translate.use('HEB');
        this.userService.appData.dir = 'rtl';
        this.currentLang = 'HEB';
        this.renderer.setAttribute(
            document.body,
            'dir',
            this.userService.appData.dir
        );
        this.renderer.addClass(
            document.body,
            this.userService.appData.dir === 'rtl' ? 'isRTL' : 'isLTR'
        );
        this.translate.get('primeng').subscribe(res => this.config.setTranslation(res));
    }

    public changeDir(val): void {
        this.currentLang = val;
        this.translate.use(val);
        this.userService.appData.dir = val === 'HEB' ? 'rtl' : 'ltr';
        this.renderer.setAttribute(
            document.body,
            'dir',
            this.userService.appData.dir
        );
        this.renderer.addClass(
            document.body,
            this.userService.appData.dir === 'rtl' ? 'isRTL' : 'isLTR'
        );
        this.translate.get('primeng').subscribe(res => this.config.setTranslation(res));
    }

    ngOnInit(): void {
        this.adminService.versionChangeTracker.subscribe((resp) =>
            this.rolloutVersionUpdateSnack()
        );
        // this.viewportHandler = () => {
        //     const divideNum = Number((window.devicePixelRatio / (window.screen.availWidth / document.documentElement.clientWidth)).toFixed(0));
        //     const numCalc = window.innerWidth / window.outerWidth;
        //     let calcZoom = (100 - ((((window.devicePixelRatio * 100) / divideNum) - 100) * numCalc));
        //     if (Math.round(numCalc) === 1 && !navigator.userAgent.includes('Macintosh')) {
        //         calcZoom = (100 / (window.devicePixelRatio * 100)) * 100;
        //     }
        //     document.body.style.zoom = calcZoom + '%';
        // };
        // this.viewportHandler();
        // window['visualViewport'].addEventListener('resize', this.viewportHandler);
    }

    unbindDocumentClickListener() {
        // if (this.documentClickListener) {
        //     this.documentClickListener();
        //     this.documentClickListener = null;
        //     this.selfClick = false;
        // }
    }

    ngAfterViewInit() {
        let subscription;
        this.stableSubscribe = this.userService.reqDataEvent.subscribe((value) => {
            this.renderer.removeClass(document.body, 'loaded');
            subscription = setTimeout(() => {
                if (value === 0) {
                    clearTimeout(subscription);
                    this.renderer.addClass(document.body, 'loaded');
                    console.log('---Finished---');
                } else {
                    this.renderer.removeClass(document.body, 'loaded');
                    console.log('---Progress---');
                }
            }, 500);
        });
    }

    ngOnDestroy() {
        if (this.stableSubscribe) {
            this.stableSubscribe.unsubscribe();
        }
        // if (this.viewportHandler) {
        //     window['visualViewport'].removeEventListener('resize', this.viewportHandler);
        // }
    }

    private rolloutVersionUpdateSnack() {
        this.snackBar.openFromComponent(NewVersionAvailablePromptComponent, {
            duration: 0,
            horizontalPosition: 'start',
            verticalPosition: 'bottom',
            direction: this.userService.appData.dir,
            panelClass: 'version-update-snack',
            data: {
                onRefreshSelected: (() => {
                    window.open(this.router.url, '_self');
                }).bind(this)
            }
        });
    }
}
