import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

@Injectable()
export class StorageService {
    constructor(@Inject(PLATFORM_ID) private platformId: any) {
    }

    private _window = typeof window === 'object' && window ? window : null;
    public localStorage: Storage = this._window.localStorage;
    public sessionStorage: Storage = this._window.sessionStorage;

    public getCookie(name: string): string {
        const nameLenPlus: number = name.length + 1;
        return (
            this._window.document.cookie
                .split(';')
                .map((c) => c.trim())
                .filter((cookie) => {
                    return cookie.substring(0, nameLenPlus) === `${name}=`;
                })
                .map((cookie) => {
                    return decodeURIComponent(cookie.substring(nameLenPlus));
                })[0] || null
        );
    }

    public localStorageSetter(name?: string, value?: string): void {
        if (isPlatformBrowser(this.platformId)) {
            this.localStorage.setItem(name, value);
        }
    }

    public localStorageGetterItem(name?: string): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return this.localStorage.getItem(name);
        } else {
            return null;
        }
    }

    public get localStorageGetAll(): Storage {
        return this.localStorage;
    }

    public localStorageRemoveItem(name?: string): void {
        if (isPlatformBrowser(this.platformId)) {
            this.localStorage.removeItem(name);
        }
    }

    public localStorageClear(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.localStorage.clear();
        }
    }

    public sessionStorageSetter(name?: string, value?: string): void {
        if (isPlatformBrowser(this.platformId)) {
            this.sessionStorage.setItem(name, value);
        }
    }

    public sessionStorageGetterItem(name?: string): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return this.sessionStorage.getItem(name);
        } else {
            return null;
        }
    }

    public get sessionStorageGetAll(): Storage {
        return this.sessionStorage;
    }

    public sessionStorageRemoveItem(name?: string): void {
        if (isPlatformBrowser(this.platformId)) {
            this.sessionStorage.removeItem(name);
        }
    }

    public sessionStorageClear(name?: string): void {
        if (isPlatformBrowser(this.platformId)) {
            if (name) {
                Object.keys(this.sessionStorageGetAll).map((c, i, a) => {
                    if (c.includes(name)) {
                        this.sessionStorageRemoveItem(c);
                    }
                });
            } else {
                this.sessionStorage.clear();
            }
        }
    }
}
