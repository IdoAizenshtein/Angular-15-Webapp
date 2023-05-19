var promptDlgWidth = 460,
    reconnectTime = 0,
    imagesInBase64 = {
        icn_download: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAgCAYAAAAMq2gFAAABOklEQVRIie2WTW6DMBCFH4h1l22VqmqPVUEvEJa9gRt6FDhDpfx0FdJj+Arx3nldhEjEdchgWlaM9CSwMZ/fzMgQvX0TwvA+ePOpIsniRIwZGIl/n/8AGs3RWKB4JA4STjUKBo1EivLtGakEkP7Ru6vbpcpONzFxPFsazQloZyxEmkDepsYk0JIhkZGwzngfWRKvd0u1Pwf93k1NoBjg5uN+pbZuHn0gEFgQ2AVAdgTefQVzU9e2nzaplKbMkEhnK2W9oAOAC9IHIO+Yd5U/rJX2QbocnVSSqARuqse1Ki9BumrUp+U1gXkXRAoyBDIC1jNnCWRPG2Wug2SFrkkUnvHieaPqaxCpo3bL104rLySQviDbpNA0Sgl4W9kXfU9vjWPho+ZaHCHfo6r/kumfYUBEL1/jeJpqFBw/d5aBU2kHOMQAAAAASUVORK5CYII=',
        icn_install: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAA+klEQVRIid2SMWoCQRiFv3GnW7BII6ZPqeAlorewtBELsZdFOz2Q0VYkXQ6QA9iaIqU+mx2Y3QRd12WKffCY4WdmPt5jzPRT5PQOfOSHnky6/rnoqd/cJFt/0FB6I3UkWOVmZbz+GcyjLEjgeSjRzc3KuCMxzIC8fQwsbtTxqJan/jz+r7qZ4LWC2pzbgpkDmclBAG3gO011T0U+g9Mv8PayTY4u0UIQV5jGORYsAcz4oA7wBWR+SUWJAM5Az17E6gFIGUXA2goGJR8wAK1dUuiwVdECnpQZ7cOggiWy5zCcgIkCcbCX2iUKB6pfdfVLFAwUiNS4f6QaXQHE5K75dPBEiQAAAABJRU5ErkJggg==',
        icn_scan: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAADI0lEQVRIibWXTUhUURTHf+/NsxRCp3QGwhKT/MDoAyNo1apmNhYkodGmaFOWmUXQcpgo2gRN5kerllEGLWqjBqZGFH2BlSRJRVqCjpNjYOaUc1q80fnovZmnMx34w+Odc+///u+9595zlbPPBAuWBbiBPcAOoASwR3xB4BPwAngIdOV2en+n6lA5k5zYDjQBJwCHlRECk0Ar4Mvr9AbNglQRMMFBEYZE8IjgSBKXiIJIm6Gg23PQVHHT038U24DrQL1FhamsHThl7/LOxysGYmAT6BCoT/ifDuoFOqbcHlsyYp9ATQZJF1AjcC2OOMZbh9CQacYYnPzu8tQlKrYLNP8/zkU0B1weeyxxk4AzkySqYvjfKXp6opx8IiuAr1jP05S2bQ3sL4a29zA++4/bD6xTBVwCjkwp3eGAo+WQnw1b8w1jHAIuTQRXppTuWgt1JaAA90egc9Q01K0JVGWCdHch1BTr33c/Q89Y0vAqLQxl6ZJWF8He9RAWuPURHo+nbFKqiZC3XEIFOLAB9hTqpDc/wHO/paZ5ahgwQtEqOFIGNtXYD3Boo076R+DGe3jmN441gibCNAmplKXA8QooyAb7CmgZhLlw1G9T4GgZ7HRCKAytg/DO9AI0tGlVYDhxy4cEmgdhOgSVdjizGXI03acpcKxCJ/01D1ffwdvgktNuWBV4ZeQc/QmX30BgDkpz4dxmWL0SGjbB9gKY+QNX3sLQ9LLy/bVyuE+qgQdmc5K/Es5vAWcO/A5Dlgo/QjrpyMySpjfW9qkC3QIBs9FNzsGlARj7qZNOzcHlAfgys+zTzS/QpYq+pC3JgqdCOvnLSbg4AN9m0zpW20oeeUMLNZdPhIlktdSPEFwbhIlZ8xgL8Ivgg+i1GBRoTEOFVTRu7NUrz9gq844IrWmoSYXW0l7v7YXdpUn8bjsNrAVqLO9Pa3Yv0veiJRZ78wK1Au0ZnN52gdryvvjyVjMY3Tz6y6EfvTJ0LlPlBHC6oi86vfGKzdfktgjlIlwQIbCEtQxE2pSbkQIotT1i5ou1hUebi+ijbXXEN0X00dYNdFf2e0OpOvwLFunYK2i9bNwAAAAASUVORK5CYII='
    };

function OnWebTwainNotFoundOnWindowsCallback(ProductName, InstallerUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion) {
    var objUrl = {'default': InstallerUrl};
    _show_install_dialog(ProductName, objUrl, bHTML5, EnumDWT_PlatformType.enumWindow, bIE, bSafari, bSSL, strIEVersion);
}

function OnWebTwainNotFoundOnLinuxCallback(ProductName, strDebUrl, strRpmUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion) {
    var objUrl = {'default': strDebUrl, 'deb': strDebUrl, 'rpm': strRpmUrl};
    _show_install_dialog(ProductName, objUrl, bHTML5, EnumDWT_PlatformType.enumLinux, bIE, bSafari, bSSL, strIEVersion);
}

function OnWebTwainNotFoundOnMacCallback(ProductName, InstallerUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion) {
    var objUrl = {'default': InstallerUrl};
    _show_install_dialog(ProductName, objUrl, bHTML5, EnumDWT_PlatformType.enumMac, bIE, bSafari, bSSL, strIEVersion);
}

function dwt_change_install_url(url) {
    var install = document.getElementById('dwt-btn-install');
    if (install)
        install.href = url;
}

function DWT_Reconnect() {
    // @ts-ignore
    if (((new Date() - window['reconnectTime']) / 1000) > 30) {
        return;
    }
    Dynamsoft.WebTwainEnv['CheckConnectToTheService'](function () {
        Dynamsoft.WebTwainEnv['ConnectToTheService']();
    }, function () {
        setTimeout(window['DWT_Reconnect'], 1000);
    });
}

function DCP_DWT_onclickInstallButton(evt) {
    const btnInstall = document.getElementById('dwt-btn-install');
    if (btnInstall) {

        setTimeout(function () {
            const install = document.getElementById('dwt-install-url-div');
            if (install) {
                install.style.display = 'none';
            }

            const el = document.getElementById('dwt-btn-install');
            if (el && el.getAttribute('html5') == '1') {

                const pel = el.parentNode;
                const newDiv = document.createElement('div');

                newDiv.id = 'dwt-btn-install';
                newDiv.className = 'dwt-btn-install-try-connect';
                newDiv.style.textAlign = 'center';
                newDiv.style.paddingBottom = '15px';
                newDiv.innerHTML = 'מנסה להתחבר לתוכנה...';
                newDiv.setAttribute('html5', '1');

                pel.removeChild(el);
                pel.appendChild(newDiv);
                window['reconnectTime'] = new Date();
                setTimeout(window['DWT_Reconnect'], 10);
            } else {
                const pel = el.parentNode;
                pel.removeChild(el);
            }

        }, 10);

    }
    return true;
}

function _show_install_dialog(ProductName, objInstallerUrl, bHTML5, iPlatform, bIE, bSafari, bSSL, strIEVersion) {
    let ObjString;

    ObjString = [
        '<div class="header-scanPopUpInstall">' +
        '<h1> זיהוי סורקים </h1>' +
        '<span class="fa fa-fw fa-times" onclick="Dynamsoft.WebTwainEnv.CloseDialog()">&nbsp;</span>' +
        '</div>'
    ];
    ObjString.push('<div style="display: flex;justify-content: center;align-items: center;margin: 15px 20px 0px 20px;"><a id="dwt-btn-install" style="display: inline-block;" target="_blank" href="');
    let url = '';
    if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumWindow) {
        url = '/assets/files/resources/dist/DynamsoftServiceSetup.msi';
    } else if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumMac) {
        url = '/assets/files/resources/dist/DynamsoftServiceSetup.pkg';
    } else if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumLinux) {
        url = '/assets/files/resources/dist/DynamsoftServiceSetup.deb';
    }
    ObjString.push(url);
    setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window['reconnectTime'] = new Date();
        setTimeout(window['DWT_Reconnect'], 10);
    }, 300);
    ObjString.push('"');
    if (bHTML5) {
        ObjString.push(' html5="1"');
    } else {
        ObjString.push(' html5="0"');
    }
    ObjString.push(' >');
    ObjString.push('<svg style="fill: #022258;height: 44px;width: auto;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><g id="Download"><path d="M464,96H304V64a8,8,0,0,0-8-8H216a8,8,0,0,0-8,8V96H48A40.045,40.045,0,0,0,8,136V360a40.045,40.045,0,0,0,40,40H181.754l-4,16H144a8,8,0,0,0-8,8v24a8,8,0,0,0,8,8H368a8,8,0,0,0,8-8V424a8,8,0,0,0-8-8H334.246l-4-16H464a40.045,40.045,0,0,0,40-40V136A40.045,40.045,0,0,0,464,96ZM224,168V72h64v96a8,8,0,0,0,8,8h14.037L256,236.041,201.963,176H216A8,8,0,0,0,224,168ZM24,136a24.027,24.027,0,0,1,24-24H208v48H184a8,8,0,0,0-5.946,13.352l72,80a8,8,0,0,0,11.892,0l72-80A8,8,0,0,0,328,160H304V112H464a24.027,24.027,0,0,1,24,24V336H24ZM360,440H152v-8H360Zm-42.246-24H194.246l4-16H313.754ZM488,360a24.027,24.027,0,0,1-24,24H48a24.027,24.027,0,0,1-24-24v-8H488Z"/><path d="M48,376H88a8,8,0,0,0,0-16H48a8,8,0,0,0,0,16Z"/><path d="M112,376h8a8,8,0,0,0,0-16h-8a8,8,0,0,0,0,16Z"/><path d="M352,272H160a8,8,0,0,0-8,8v32a8,8,0,0,0,8,8H352a8,8,0,0,0,8-8V280A8,8,0,0,0,352,272Zm-8,32H168V288H344Z"/></g></svg>');
    ObjString.push('</a></div>');


    ObjString.push('<div class="scanPopUpInstall-text">' +
        'כדי להתחיל לסרוק ישירות מהסורק שבמשרדך ל- bizibox' +
        '<br>' +
        'נבצע תהליך התקנה חד פעמי של תוכנה לזיהוי סורקים.' +
        '<strong>' +
        'ההורדה מתבצעת אוטומטית,' +
        '<br>' +
        'בסיומה יש לבצע את ההתקנה במחשב.' +
        '</strong></div>');

    if (bHTML5) {
        if (bIE) {
            ObjString.push('<div class="dynamsoft-dwt-dlg-tail" style="text-align:right; padding-right: 80px">');
            ObjString.push('1. יש להוסיף את האתר לרשימת האתרים הבטוחים שנמצא במיקום הבא:<br />');
            ObjString.push('IE | Tools | Internet Options | Security | Trusted Sites.<br />');
            ObjString.push('2. לאחר מכן, יש לרענן את חלונית הדפדפן');
            ObjString.push('</div>');
        }
    } else {
        ObjString.push('<div class="dynamsoft-dwt-dlg-tail" style="text-align:right; padding-right: 80px">');
        if (bIE) {
            ObjString.push('לאחר ההתקנה יש לבצע את הפעולות הבאות:<br />');
            ObjString.push('1. אתחלו (Restart) את הדפדפן מחדש<br />');
            ObjString.push('2.  אפשרו ל-"DynamicWebTWAIN" לרוץ בדפדפן ע״י לחיצה על הסרגל העליון בדפדפן.');
        } else {
            ObjString.push('<div class="dynamsoft-dwt-dlg-red">לאחר ההתקנה יש <strong>לרענן</strong> את חלונית הדפדפן.</div>');
        }
        ObjString.push('</div>');
    }

    // @ts-ignore
    Dynamsoft.WebTwainEnv.ShowDialog(window['promptDlgWidth'], 0, ObjString.join(''));
}

function OnWebTwainOldPluginNotAllowedCallback(ProductName) {
    var ObjString = [
        '<div class="dynamsoft-dwt-dlg-title">',
        ProductName,
        ' plugin is not allowed to run on this site.',
        '</div>',
        '<div class="dynamsoft-dwt-dlg-tail" style="margin-top:40px">',
        'Please click "<strong>Always run on this site</strong>" for the prompt that says <br />"<strong>',
        ProductName,
        ' Plugin needs your permission to run</strong>"<br /><div class="dynamsoft-dwt-dlg-red">After that, you need to refresh or restart the browser.',
        '</div></div>'];

    Dynamsoft.WebTwainEnv.ShowDialog(promptDlgWidth, 0, ObjString.join(''));
}

function OnWebTwainNeedUpgradeCallback(ProductName, objInstallerUrl, bHTML5, iPlatform,
                                       bIE, bSafari, bSSL, strIEVersion, bForceUpgrade, bError, strErrorString) {
    var browserActionNeeded, ObjString, title, bActiveX = !bHTML5 && bIE, bPlugin = !bHTML5 && !bIE;
    if (bError) {
        ObjString = [
            '<div class="dynamsoft-dwt-dlg-center">',
            '<div class="dynamsoft-dwt-dlg-errorIcon"></div>',
            '</div>',
            '<div class="dynamsoft-dwt-dlg-error">',
            strErrorString,
            '</div>'
        ];
    } else {
        if (bActiveX)
            title = 'The ActiveX to scan needs to be updated';
        else if (bPlugin)
            title = 'The Plugin to scan needs to be updated';
        else
            title = 'The scan service needs to be updated';
        ObjString = [
            '<div class="dynamsoft-dwt-dlg-title">',
            title,
            '</div>'];
    }
    if (iPlatform == EnumDWT_PlatformType.enumLinux || navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
        browserActionNeeded = 'RESTART';
    } else {
        browserActionNeeded = 'REFRESH';
    }
    if (bHTML5) {
        ObjString.push('<div class="dynamsoft-dwt-installdlg-iconholder"> ');
        ObjString.push('<div class="dynamsoft-dwt-installdlg-splitline" style="left: 125px"></div>');
        ObjString.push('<div class="dynamsoft-dwt-installdlg-splitline" style="left: 283px"></div>');
        ObjString.push('<img style="margin: 0px 134px 0px 0px" src=' + imagesInBase64.icn_download + ' alt="Update">');
        ObjString.push('<img style="margin: 2px 132px 2px 0px" src=' + imagesInBase64.icn_install + ' alt="install">');
        ObjString.push('<img src=' + imagesInBase64.icn_scan + ' alt="scan">');
        ObjString.push('<div><span class="dynamsoft-dwt-installdlg-text" style="right: 125px">Download</span>');
        ObjString.push('<span class="dynamsoft-dwt-installdlg-text" style="right: 18px">Update</span>');
        ObjString.push('<span class="dynamsoft-dwt-installdlg-text" style="left: 105px">Scan</span>');
        ObjString.push('</div>');
        ObjString.push('</div>');
    }
    if (bHTML5 && iPlatform == EnumDWT_PlatformType.enumLinux) {
        ObjString.push('<div style="margin:10px 0 0 19px;"><div id="dwt-install-url-div"><div><input id="dwt-install-url-deb" name="dwt-install-url" type="radio" onclick="dwt_change_install_url(\'' + objInstallerUrl.deb + '\')" checked="checked" /><label for="dwt-install-url-deb">64 bit .deb (For Ubuntu/Debian)</label></div>');
        ObjString.push('<div><input id="dwt-install-url-rpm" name="dwt-install-url" type="radio" onclick="dwt_change_install_url(\'' + objInstallerUrl.rpm + '\')" /><label for="dwt-install-url-rpm">64 bit .rpm (For Fedora)</label></div></div></div>');
    } else {
        if (!bError)
            ObjString.push('<div style="margin-top:40px;"></div>');
    }
    ObjString.push('<a id="dwt-btn-install" target="_blank" href="');
    ObjString.push(objInstallerUrl['default']);
    ObjString.push('" onclick="DCP_DWT_onclickInstallButton(this)"><div class="dynamsoft-dwt-dlg-button">Download</div></a>');
    ObjString.push('<p></p>');
    ObjString.push('<div class="dynamsoft-dwt-dlg-tail">');
    if (bActiveX) {
        ObjString.push('A newer version of the ActiveX is available. Please download and update now.');
        ObjString.push('<div class="dynamsoft-dwt-dlg-red">Please EXIT Internet Explorer before you install the new version.</div>');
    } else if (bPlugin) {
    } else {
        ObjString.push('A newer version of the scan service is available on this page. <br /> Please download and update now.');
    }
    ObjString.push('</div>');
    Dynamsoft.WebTwainEnv.ShowDialog(promptDlgWidth, 0, ObjString.join(''), false, bForceUpgrade);
}

function OnWebTwainPreExecuteCallback() {
    //Dynamsoft.WebTwainEnv.OnWebTwainPreExecute();
}

function OnWebTwainPostExecuteCallback() {
    //Dynamsoft.WebTwainEnv.OnWebTwainPostExecute();
}

function OnRemoteWebTwainNotFoundCallback(ProductName, ip, port, bSSL) {
    var ObjString = [
        '<div class="dynamsoft-dwt-dlg-tips">',
        'Dynamsoft Service is missing a certificate for the following IP/domain <br />',
        'or isn\'t installed on the PC with the following IP/domain <br />',
        '"', ip, '".<br />',
        'Please make sure you have put the correct certificate <br />',
        'in the {Dynamsoft Service Directory}<br />',
        'or that Dynamsoft Service is installed on that specified PC.',
        '</div>',
        '<div class="dynamsoft-dwt-dlg-tail">',
        '<div class="dynamsoft-dwt-dlg-red">After installation, please REFRESH your browser.</div></div>'
    ];
    Dynamsoft.WebTwainEnv.ShowDialog(promptDlgWidth, 0, ObjString.join(''));
}

function OnRemoteWebTwainNeedUpgradeCallback(ProductName, ip, port, bSSL) {
    var ObjString = [
        '<div class="dynamsoft-dwt-dlg-tips">',
        'Dynamsoft Service is outdated on the PC with IP/domain <br />',
        '"', ip, '".<br />',
        'Please open the page on that PC to download and install it.',
        '</div>',
        '<div class="dynamsoft-dwt-dlg-tail">',
        '<div class="dynamsoft-dwt-dlg-red">After installation, please REFRESH your browser.</div></div>'
    ];
    Dynamsoft.WebTwainEnv.ShowDialog(promptDlgWidth, 0, ObjString.join(''));
}

function OnWebTWAINDllDownloadSuccessful() {
    console.log('The Web TWAIN Module was downloaded successfully!');
}

function OnWebTWAINDllDownloadFailure(ProductName, errorCode, errorString) {
    if (errorCode == EnumDWT_Error.ModuleNotExists) {
        var ObjString = [
            '<div class="dynamsoft-dwt-dlg-tips">',
            errorString,
            '</div>',
            '<div class="dynamsoft-dwt-dlg-tail">',
            '<div class="dynamsoft-dwt-dlg-red">You can try <strong>REFRESHING</strong> your browser to try again. <br /> If the issue persists, please contact the website administrator.</div></div>'
        ];
        Dynamsoft.WebTwainEnv.ShowDialog(promptDlgWidth, 0, ObjString.join(''));

    }
    return true;
}

function OnGetServiceUpdateStatus(bError, statusCode, statusString) {
    if (statusString != "Update skipped")
        console.log(statusString);
}

function OnWebTWAINModuleDownloadManually(objInstallerUrl, iPlatform, bIE, bSafari, bSSL, strIEVersion) {
    return _show_install_dialog('', objInstallerUrl, true, iPlatform, bIE, bSafari, bSSL, strIEVersion);
}
