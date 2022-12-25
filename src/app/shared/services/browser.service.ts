/* tslint:disable:max-line-length */

import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';

export const browser: any = {
    versionSearchString: '',
    searchString: function (data) {
        var l = data.length;
        for (let i = 0; i < l; i++) {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) !== -1) {
                    return data[i].identity;
                }
            } else if (dataProp) {
                return data[i].identity;
            }
        }
    },
    searchVersion: function (dataString) {
        const index = dataString.indexOf(this.versionSearchString);
        if (index === -1) {
            return false;
        }
        return parseFloat(
            dataString.substring(index + this.versionSearchString.length + 1)
        );
    },
    dataBrowser: [
        {
            string: window.navigator.userAgent,
            subString: 'Edge',
            identity: 'Edge'
        },
        {
            string: navigator.userAgent,
            subString: 'Chrome',
            identity: 'Chrome'
        },
        {
            string: window.navigator.userAgent,
            subString: 'OmniWeb',
            versionSearch: 'OmniWeb/',
            identity: 'OmniWeb'
        },
        {
            string: window.navigator.vendor,
            subString: 'Apple',
            identity: 'Safari',
            versionSearch: 'Version'
        },
        {
            string: window.navigator.vendor,
            subString: 'iCab',
            identity: 'iCab'
        },
        {
            string: window.navigator.vendor,
            subString: 'KDE',
            identity: 'Konqueror'
        },
        {
            string: window.navigator.userAgent,
            subString: 'Firefox',
            identity: 'Firefox'
        },
        {
            string: window.navigator.vendor,
            subString: 'Camino',
            identity: 'Camino'
        },
        {
            string: window.navigator.userAgent,
            subString: 'Netscape',
            identity: 'Netscape'
        },
        {
            string: window.navigator.userAgent,
            subString: 'MSIE',
            identity: 'Explorer',
            versionSearch: 'MSIE'
        },
        {
            string: window.navigator.userAgent,
            subString: 'Gecko',
            identity: 'Mozilla',
            versionSearch: 'rv'
        },
        {
            // for older Netscapes (4-)
            string: window.navigator.userAgent,
            subString: 'Mozilla',
            identity: 'Netscape',
            versionSearch: 'Mozilla'
        }
    ],
    dataOS: [
        {
            string: window.navigator.platform,
            subString: 'Win',
            identity: 'Windows'
        },
        {
            string: window.navigator.platform,
            subString: 'os',
            identity: 'os'
        },
        {
            string: window.navigator.platform,
            subString: 'Mac',
            identity: 'MacOS'
        },
        {
            string: window.navigator.userAgent,
            subString: 'iPhone',
            identity: 'iPhone/iPod'
        },
        {
            string: window.navigator.userAgent,
            subString: 'X11',
            identity: 'UNIX'
        },
        {
            string: window.navigator.platform,
            subString: 'Linux',
            identity: 'Linux'
        }
    ]
};

@Injectable()
export class BrowserService {
    get browserDetect(): any {
        const browserDetect: any = {
            browser:
                browser.searchString(browser.dataBrowser) || 'An unknown browser',
            version:
                browser.searchVersion(window.navigator.userAgent) ||
                browser.searchVersion(window.navigator.appVersion) ||
                'an unknown version',
            OS: browser.searchString(browser.dataOS) || 'an unknown OS'
        };
        return browserDetect;
    }

    static pathFrom($event: any): Array<any> {
        if ($event.path != null) {
            return $event.path;
        }

        const path: Array<any> = [];
        let evntTrgt: any = $event.target;
        while (evntTrgt != null) {
            path.unshift(evntTrgt);
            evntTrgt = evntTrgt.parentElement;
        }
        return path;
    }

    static getComputedStyleCssText(element) {
        const style = window.getComputedStyle(element, null);

        if (style.cssText) {
            return style.cssText;
        }

        let cssText = '';
        for (let i = 0; i < style.length; i++) {
            cssText += style[i] + ': ' + style.getPropertyValue(style[i]) + '; ';
        }

        return cssText;
    }

    static printHtml(src: HTMLElement, title: string) {
        if (src) {
            const dest: HTMLElement = src.cloneNode(true) as HTMLElement;
            dest.style.cssText = BrowserService.getComputedStyleCssText(src);
            const vSrcElements = src.getElementsByTagName('*');
            const vDstElements = dest.getElementsByTagName('*');

            for (let i = vSrcElements.length; i--;) {
                const vSrcElement = vSrcElements[i] as HTMLElement;
                const vDstElement = vDstElements[i] as HTMLElement;
                vDstElement.style.cssText =
                    BrowserService.getComputedStyleCssText(vSrcElement);
                if (
                    !vDstElement.className ||
                    typeof vDstElement.className.includes !== 'function'
                ) {
                    continue;
                }
                if (
                    [
                        'body-container',
                        'image-container',
                        'scroll-content',
                        'scroll-wrapper',
                        'scroll-chrome',
                        'scroll-print'
                    ].some((cn) => vDstElement.className.includes(cn))
                ) {
                    vDstElement.style.overflow = 'visible';
                    vDstElement.style.maxHeight = 'unset';
                    vDstElement.style.height = 'unset';
                }
                if (vDstElement.className.includes('scroll-print')) {
                    vDstElement.style.display = 'block';
                    vDstElement.style.margin = '0 auto';
                }
                if (vDstElement.className.includes('html-inlined')) {
                    vDstElement.style.border = 'none';
                }
                if (
                    vDstElement.className.includes('mainTable') ||
                    vDstElement.className.includes('controlCube') ||
                    vDstElement.className.includes('left')
                ) {
                    vDstElement.style.height = 'unset';
                }
                if (
                    vDstElement.className.includes('controlCubePrint') &&
                    !vDstElement.className.includes('active')
                ) {
                    vDstElement.remove();
                }
                if (
                    vDstElement.className.includes('controlCubePrint') &&
                    vDstElement.className.includes('active')
                ) {
                    vDstElement.style.display = 'block';
                    vDstElement.style.marginBottom = '20px';
                    vDstElement.style.height = 'auto';
                }
                if (vDstElement.nodeName === 'INPUT') {
                    // @ts-ignore
                    const val = vDstElement['value'];
                    const span = document.createElement('SPAN');
                    span.innerText = val;
                    // @ts-ignore
                    span['style'] = vDstElement.style;
                    vDstElement.parentNode.replaceChild(span, vDstElement);
                }
                if (
                    vDstElement.className.includes('scroll-element') ||
                    vDstElement.className.includes('dont-print')
                ) {
                    vDstElement.remove();
                }
                if (vDstElement.className.includes('text-ellipsis')) {
                    vDstElement.style.textOverflow = 'unset';
                }
                if (vDstElement.nodeName === 'P-OVERLAYPANEL') {
                    vDstElement.remove();
                }
            }

            let docStyle = '';
            Array.from(src.ownerDocument.getElementsByTagName('style')).forEach(
                function (styleElem) {
                    docStyle += (<HTMLStyleElement>styleElem).outerHTML;
                }
            );
            Array.from(src.ownerDocument.getElementsByTagName('link')).forEach(
                function (styleElem) {
                    docStyle += (<HTMLLinkElement>styleElem).outerHTML;
                }
            );

            docStyle +=
                '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Assistant:200,300,400,600,700,800&subset=hebrew"/>';

            const popupWindow = window.open('', '_blank');
            popupWindow.document.open();
            popupWindow.document.write(
                '<html><head>' +
                '<title>' +
                title +
                '</title>' +
                '<style>' +
                '   * {' +
                '                -webkit-print-color-adjust: exact !important;' +
                '                color-adjust: exact !important;' +
                '            }' +
                '</style>' +
                docStyle +
                '</head>' +
                '<body onload="window.print(); setTimeout(function(){ window.close() }, 500)">' +
                dest.innerHTML +
                '</body></html>'
            );

            popupWindow.document.close();
        }
    }

    static flattenControls(
        abCntrl: AbstractControl,
        collected: AbstractControl[] = []
    ): AbstractControl[] {
        if (abCntrl instanceof FormGroup) {
            Object.values((abCntrl as FormGroup).controls).forEach((ac) =>
                BrowserService.flattenControls(ac, collected)
            );
        } else if (abCntrl instanceof FormArray) {
            (abCntrl as FormArray).controls.forEach((ac) =>
                BrowserService.flattenControls(ac, collected)
            );
        } else if (abCntrl instanceof AbstractControl) {
            collected.push(abCntrl);
        }

        return collected;
    }

    static isMobile() {
        return /mobi/gi.test(window.navigator.userAgent);
    }

    static mobileAppLinkToStore() {
        if (/android/gi.test(window.navigator.userAgent)) {
            return 'https://play.google.com/store/apps/details?id=com.biziboxapp&rdid=com.biziboxapp';
        }
        if (/iphone/gi.test(window.navigator.userAgent)) {
            return 'https://itunes.apple.com/us/app/bizibox-ui/id1448852782';
        }
        return null;
    }
}
