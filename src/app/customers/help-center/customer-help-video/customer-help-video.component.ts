import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { PlayVideoDialogComponent } from './play-video-dialog/play-video-dialog.component';
import { Subject } from 'rxjs/internal/Subject';
import { CustomersHelpCenterComponent } from '../customers-help-center/customers-help-center.component';

@Component({
  selector: 'app-customer-help-video',
  templateUrl: './customer-help-video.component.html',
  encapsulation: ViewEncapsulation.None // ,
  // styleUrls: ['./customer-help-video.component.scss']
})
export class CustomerHelpVideoComponent implements OnInit, OnDestroy {
  // private videoList$: Observable<Array<VideoData>>;
  private readonly destroyed$ = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    public customersHelpCenterComponent: CustomersHelpCenterComponent
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit() {
    console.log('ngOnInit')
    // this.videoList$ = this.sharedComponent.getDataEvent
    //     .pipe(
    //         startWith(true),
    //         filter(() => this.userService.appData
    //             && this.userService.appData.userData
    //             && this.userService.appData.userData.companySelect
    //             && this.userService.appData.userData.companySelect.biziboxType),
    //         switchMap(() => this.helpCenterService.requestVideoList()),
    //         map((response:any) => !response.error ? response.body : null),
    //         tap(response => {
    //             if (Array.isArray(response)) {
    //                 response
    //                     .forEach(item => {
    //                         item.vimeoData = this.helpCenterService.requestVimeoData(item.url);
    //                     });
    //             }
    //         }),
    //         publishReplay(1),
    //         refCount(),
    //         takeUntil(this.destroyed$)
    //     );
  }

  playVideoInDialog(vimeoData: any) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    const innerWidth = window.innerWidth;
    let relativeWidth = (innerWidth * 80) / 100; // take up to 80% of the screen size
    if (innerWidth > 1500) {
      relativeWidth = (1500 * 80) / 100;
      // } else {
      //     relativeWidth = (innerWidth * 80) / 100;
    }

    const relativeHeight = (relativeWidth * 9) / 16; // 16:9 to which we add 120 px for the dialog action buttons ("close")
    // const relativeHeight = (relativeWidth * 9) / 16 + 120; // 16:9 to which we add 120 px for the dialog action buttons ("close")
    // dialogConfig.width = relativeWidth + 'px';
    // dialogConfig.height = 'auto'; // relativeHeight + 'px';

    dialogConfig.width = 1200 + 'px';
    dialogConfig.height = '690px'; // relativeHeight + 'px';

    dialogConfig.data = {
      vimeoData: vimeoData,
      relativeWidth: relativeWidth,
      relativeHeight: relativeHeight
    };

    this.dialog.open(PlayVideoDialogComponent, dialogConfig);
    // const dialogRef = this.dialog.open(PlayVideoDialogComponent, dialogConfig);
  }
}
