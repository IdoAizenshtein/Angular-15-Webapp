import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy
} from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { DomSanitizer } from '@angular/platform-browser';
import Player from '@vimeo/player';

@Component({
  selector: 'app-play-video-dialog',
  template: `
    <mat-dialog-content class="mat-dialog-content-video">
      <div id="vimeo-player">
        <!--      <div class="videoWrapper" [innerHTML]="safePlayer" id="vimeo-player">-->
        <!--        <iframe style="height: auto; width: auto; position: relative;" fill [src]='safeUrl'  allowfullscreen width="560" height="315"></iframe>-->
      </div>
    </mat-dialog-content>
  `
})
export class PlayVideoDialogComponent
  implements  OnDestroy, AfterViewInit
{
  readonly vimeoData: any;
  safePlayer: any;
  player: Player;

  readonly dialogW: number;
  readonly dialogH: number;

  constructor(
    private dialogRef: MatDialogRef<PlayVideoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private _sanitizer: DomSanitizer
  ) {
    this.vimeoData = data.vimeoData;
    this.dialogW = data.relativeWidth;
    this.dialogH = data.relativeHeight;
    // this.safePlayer = this._sanitizer.bypassSecurityTrustHtml(this.vimeoData.html);
    // this.safeUrl = this._sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${this.bookmark.youtubeVideoId}`);
  }

  ngAfterViewInit(): void {
    this.player = new Player('vimeo-player', {
      id: this.vimeoData.video_id, // +val.url, // id: 202742042, // 231377016,
      // maxwidth: this.vimeoData.width, // 460,
      autoplay: true,
      maxwidth: this.dialogW,
      maxheight: this.dialogH,
      responsive: true
    });
  }



  ngOnDestroy(): void {
    if (this.player) {
      this.player.destroy();
    }
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }
}
