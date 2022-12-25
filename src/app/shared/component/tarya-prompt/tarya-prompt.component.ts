import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {HttpServices} from '@app/shared/services/http.services';
import {UserService} from '@app/core/user.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {BrowserService} from '@app/shared/services/browser.service';
import {StorageService} from '@app/shared/services/storage.service';

@Component({
    selector: 'app-tarya-prompt',
    templateUrl: './tarya-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TaryaPromptComponent implements OnInit, OnDestroy {
    static readonly TARYA_PROMPT_COUNT_MAX_APPEARENCES = 3;

    visible: boolean;

    private presentedTimes: number;

    private _settings: {
        companiesSelectable: Array<any>;
    };
    @Input()
    set settings(value: { companiesSelectable: Array<any> }) {
        this._settings = value;

        this.companiesSelectable = this._settings.companiesSelectable.map(
            (cmpny) => {
                return {
                    label: cmpny.companyName,
                    value: cmpny.companyId
                };
            }
        );

        if (this.companiesSelectable.length === 1) {
            this.form.patchValue({
                company: this.companiesSelectable[0].value
            });
        }

        this.presentedTimes =
            Number(
                this.storageService.localStorageGetterItem(
                    TaryaPromptComponent.TARYA_PROMPT_COUNT_STORAGE_KEY(this.userService)
                )
            ) || 0;
        this.presentedTimes++;

        this.visible =
            this._settings &&
            Array.isArray(this._settings.companiesSelectable) &&
            !!this._settings.companiesSelectable.length &&
            this.presentedTimes <=
            TaryaPromptComponent.TARYA_PROMPT_COUNT_MAX_APPEARENCES;

        if (
            this.presentedTimes >
            TaryaPromptComponent.TARYA_PROMPT_COUNT_MAX_APPEARENCES
        ) {
            this.httpServices
                .sendHttp<any>({
                    method: 'post',
                    path: 'v1/users/hide-tarya-popup',
                    params: {
                        vanish: false
                    },
                    isJson: true,
                    isProtected: true,
                    isAuthorization: true
                })
                .subscribe({
                    complete: () => {
                        delete this.userService.appData.userData.taryaPopupPrompt;
                        this.storageService.localStorageRemoveItem(
                            TaryaPromptComponent.TARYA_PROMPT_COUNT_STORAGE_KEY(
                                this.userService
                            )
                        );
                    }
                });
        }
    }

    companiesSelectable: Array<{ label: string; value: string }>;

    private readonly destroyed$ = new Subject<void>();

    readonly form: any = new FormGroup({
        company: new FormControl(null, [Validators.required]),
        dontShowAgain: new FormControl(false)
    });

    static TARYA_PROMPT_COUNT_STORAGE_KEY(us: UserService) {
        return us.appData.userData.userName + '_taryaPrompt.presentedTimes';
    }

    constructor(
        public userService: UserService,
        private httpServices: HttpServices,
        private storageService: StorageService
    ) {
        // this.presentedTimes = Number(this.storageService.localStorageGetterItem(
        //     this.userService.appData.userData.userName + '_taryaPrompt.presentedTimes')) || 0;
    }

    ngOnInit(): void {
        console.log('')
        // this.visible = true;
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    provideLink(): void {
    }

    hide(): void {
        this.visible = false;

        if (
            this.form.value.dontShowAgain ||
            this.presentedTimes >=
            TaryaPromptComponent.TARYA_PROMPT_COUNT_MAX_APPEARENCES
        ) {
            this.httpServices
                .sendHttp<any>({
                    method: 'post',
                    path: 'v1/users/hide-tarya-popup',
                    params: {
                        vanish: this.form.value.dontShowAgain
                    },
                    isJson: true,
                    isProtected: true,
                    isAuthorization: true
                })
                .subscribe({
                    complete: () => {
                        delete this.userService.appData.userData.taryaPopupPrompt;
                        this.storageService.localStorageRemoveItem(
                            TaryaPromptComponent.TARYA_PROMPT_COUNT_STORAGE_KEY(
                                this.userService
                            )
                        );
                    }
                });
        } else {
            this.storageService.localStorageSetter(
                TaryaPromptComponent.TARYA_PROMPT_COUNT_STORAGE_KEY(this.userService),
                String(this.presentedTimes)
            );
            delete this.userService.appData.userData.taryaPopupPrompt;
        }
    }

    markInvalidIfNeeded() {
        if (this.form.invalid) {
            BrowserService.flattenControls(this.form).forEach((ac) =>
                ac.markAsDirty()
            );
            return false;
        }

        return true;
    }

    apply() {
        this.httpServices
            .sendHttp<any>({
                method: 'post',
                path: 'v1/auth/otp/create-api-token',
                params: {
                    companyAccountIds: null,
                    targetUserId: '16f8acbf-c11d-045b-e053-650aa8c09c49',
                    companyId: this.form.value.company
                },
                isJson: true,
                isProtected: true,
                isAuthorization: true,
                responseType: 'text'
            })
            .subscribe({
                next: (response: any) => {
                    // this.form.get('dontShowAgain').setValue(true);
                    window.open(response.body, '_blank');
                },
                complete: () => {
                    this.visible = false;
                }
            });
    }
}
