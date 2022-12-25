import {Component, Input, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class DialogComponent {
    @Input() unmaskAppHeader = false;
    @Input() closeOut = false;
    public width: any;
    public height: any;
    public minWidth: any;

    // constructor(
    //   public domHandler: DomHandler,
    //   el: ElementRef,
    //   renderer: Renderer2,
    //   zone: NgZone,
    //   cd: ChangeDetectorRef,
    //   config: PrimeNGConfig
    // ) {
    //   super(el, renderer, zone, cd, config);
    // }
    // ngAfterViewChecked() {
    //   // if (this.executePostDisplayActions) {
    //   //   this.onShow.emit({});
    //   //   this.positionOverlay();
    //   //   if (this.focusOnShow) {
    //   //     this.focus();
    //   //   }
    //   //   this.currentHeight = DomHandler.getOuterHeight(
    //   //     this.containerViewChild.nativeElement
    //   //   );
    //   //   this.executePostDisplayActions = false;
    //   // } else if (this.autoAlign && this.visible) {
    //   //   this.zone.runOutsideAngular(() => {
    //   //     setTimeout(() => {
    //   //       const height = DomHandler.getOuterHeight(
    //   //         this.containerViewChild.nativeElement
    //   //       );
    //   //
    //   //       if (
    //   //         height < this.currentHeight - 1 ||
    //   //         height > this.currentHeight + 1
    //   //       ) {
    //   //         // if (height !== this.currentHeight) {
    //   //         this.currentHeight = height;
    //   //         this.positionOverlay();
    //   //       }
    //   //     }, 50);
    //   //   });
    //   // }
    // }
    //
    // override onDrag(event: MouseEvent): void {
    //   if (this.dragging) {
    //     const deltaX = event.pageX - this.lastPageX;
    //     const deltaY = event.pageY - this.lastPageY;
    //     const leftPos =
    //       parseInt(this.contentViewChild.nativeElement.style.left, 10) + deltaX;
    //     const topPos =
    //       parseInt(this.contentViewChild.nativeElement.style.top, 10) + deltaY;
    //     const rightPos = leftPos + this.style.width;
    //     if (leftPos >= this.minX) {
    //       this.contentViewChild.nativeElement.style.left = leftPos + 'px';
    //     }
    //     if (topPos >= this.minY) {
    //       this.contentViewChild.nativeElement.style.top = topPos + 'px';
    //     }
    //     if (rightPos >= window.innerWidth) {
    //       this.contentViewChild.nativeElement.style.left =
    //         window.innerWidth - this.style.width + 'px';
    //     }
    //     if (topPos + this.style.currentHeight >= window.innerHeight) {
    //       this.contentViewChild.nativeElement.style.top =
    //         window.innerHeight - this.style.currentHeight + 'px';
    //     }
    //     this.lastPageX = event.pageX;
    //     this.lastPageY = event.pageY;
    //   }
    // }
    //
    // override enableModality(): void {
    //   super.enableModality();
    //
    //   if (this.wrapper instanceof HTMLElement && this.unmaskAppHeader) {
    //     (this.wrapper as HTMLElement).setAttribute(
    //       'style',
    //       'top: 75px; z-index: 1;'
    //     );
    //   }
    // }
}
