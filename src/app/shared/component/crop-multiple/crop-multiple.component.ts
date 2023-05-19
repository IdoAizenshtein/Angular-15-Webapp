import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

const Konva = window['Konva'];

@Component({
    selector: 'app-crop-multiple',
    templateUrl: './crop-multiple.component.html'
})
export class CropMultipleComponent implements OnInit, AfterViewInit, OnDestroy {
    @Output() splitImages = new EventEmitter<any>();

    public _imgSrc: any;
    public size: any;
    public stage: any = null;
    public layer: any = null;

    public iX: any = 100;
    public iY: any = 100;
    public index: any = 0;
    public clone: any;
    public aspectRatioW: any;
    public aspectRatioH: any;
    public showLoader: boolean = true;
    public heightPopup: any;


    @Input()
    set imgSrc(_imgSrc: any) {
        if (_imgSrc === true) {
            return;
        }
        if (this._imgSrc !== _imgSrc) {
            this.showLoader = true;
            console.log('_imgSrc');
            this._imgSrc = _imgSrc;
            setTimeout(() => {
                this.loadBox();
            }, 20);
        } else {

        }
    }

    ngOnInit() {
        console.log('ngOnInit');
        Konva.pixelRatio = 1;
        this.heightPopup = window.innerHeight - 211;
    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit');
    }

    getRotatedRectBB(x, y, width, height, rAngle): any {
        var absCos = Math.abs(Math.cos(rAngle));
        var absSin = Math.abs(Math.sin(rAngle));
        var cx = x + width / 2 * Math.cos(rAngle) - height / 2 * Math.sin(rAngle);
        var cy = y + width / 2 * Math.sin(rAngle) + height / 2 * Math.cos(rAngle);
        var w = width * absCos + height * absSin;
        var h = width * absSin + height * absCos;
        return ({
            cx: cx,
            cy: cy,
            width: w,
            height: h
        });
    }

    loadImg(dataURL1: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve(img);
            };
            img.src = dataURL1;
        });
    }

    private loadBox() {
        // @ts-ignore
        const _this = this;
        if (this.stage) {
            console.log('--------destroy stage---------');
            this.stage.destroy();
        }
        if (this.layer) {
            console.log('--------destroy layer---------');
            this.layer.destroy();
        }
        if (
            this._imgSrc
        ) {
            this.stage = new Konva.Stage({
                container: 'crop-konva',
                width: 1300,
                height: this.heightPopup
            });
            this.stage.container().style.cursor = 'default';
            this.layer = new Konva.Layer({
                listening: true
            });
            Konva.Image.fromURL(this._imgSrc, (konvaImage) => {
                // console.log(konvaImage.attrs)
                _this.clone = new Konva.Image({
                    image: konvaImage.attrs.image
                });
                _this.size = {width: _this.clone.width(), height: _this.clone.height()};
                // console.log(_this.size);
                const width = _this.size.width;
                const height = _this.size.height;
                // const prop = width / 1300;
                // const new_height = height / prop;
                // _this.stage.height(new_height);
                const prop = height / this.heightPopup;
                const new_width = width / prop;
                _this.size.stage_new_width = new_width;
                _this.stage.width(new_width);
                konvaImage.setAttrs({
                    id: 'konvaImageBg',
                    y: 0,
                    x: 0,
                    width: new_width,
                    height: this.heightPopup
                });
                _this.layer.add(konvaImage);
                // console.log(new_height)
                _this.aspectRatioH = this.heightPopup / height;
                _this.aspectRatioW = new_width / width;
                // console.log(size, aspectRatioW, aspectRatioH)
                _this.stage.add(_this.layer);
                this.showLoader = false;
                this.addBox();
            });
        }
    }


    public async crop() {
        const _this = this;
        const node_layer = this.layer.find('.RectBox');
        if (node_layer.length) {
            const width = this.clone.width();
            const height = this.clone.height();
            const newCopyStage = new Konva.Stage({
                container: 'preview',
                width: width,
                height: height
            });
            let newCopyLayer = this.layer.clone({listening: false});
            newCopyStage.add(newCopyLayer);
            const konvaImageBg = newCopyLayer.find('#konvaImageBg')[0];
            konvaImageBg.width(width);
            konvaImageBg.height(height);
            const dataURLs = [];
            for (let i = 0; i < node_layer.length; i++) {
                const it = node_layer[i];
                const cloneChild = this.clone.clone();
                const nodes_layer_transfMain = this.layer.find('#Transformer_' + it.id().replace('Rect_', ''));
                const dataURL1 = cloneChild.toDataURL({
                    quality: 1.0,
                    mimeType: 'image/jpeg'
                });
                const blueX = it.x() / this.aspectRatioW;
                const blueY = it.y() / this.aspectRatioH;
                const blueWidth = (it.width() * it.scaleX()) / this.aspectRatioW;
                const blueHeight = (it.height() * it.scaleY()) / this.aspectRatioH;
                const blueAngle = it.rotation() * Math.PI / 180;
                const angleComplete = it.rotation();
                const img = await this.loadImg(dataURL1);
                const canvas1 = document.createElement('canvas');
                const ctx1 = canvas1.getContext('2d');
                const canvas2 = document.createElement('canvas');
                const ctx2 = canvas2.getContext('2d');
                const rectBB = this.getRotatedRectBB(blueX, blueY, blueWidth, blueHeight, blueAngle);
                // console.log(rectBB)
                canvas1.width = canvas2.width = rectBB.width;
                canvas1.height = canvas2.height = rectBB.height;
                ctx1.drawImage(img,
                    rectBB.cx - rectBB.width / 2,
                    rectBB.cy - rectBB.height / 2,
                    rectBB.width,
                    rectBB.height,
                    0,
                    0,
                    rectBB.width,
                    rectBB.height);
                // ctx2.clearRect(0, 0, canvas1.width, canvas1.height);
                // ctx2.fillStyle = "rgba(216,216,150,1.0)";
                // console.log(canvas1.width/2, canvas1.height/2)
                canvas2.width = blueWidth;
                canvas2.height = blueHeight;
                ctx2.translate(canvas2.width / 2, canvas2.height / 2);
                ctx2.rotate(-blueAngle);
                ctx2.drawImage(canvas1, -canvas1.width / 2, -canvas1.height / 2);
                const fullQuality = canvas2.toDataURL('image/jpeg', 1.0);
                dataURLs.push(fullQuality);
                // var img1 = document.createElement('img');
                // img1.src = fullQuality;
                // img1.className = "img-pos1";
                // document.body.appendChild(img1);
                // const complexTextMain = new Konva.Text({
                //     x: it.x(),
                //     y: it.y(),
                //     text: "הופרד",
                //     fontSize: 17,
                //     fontFamily: 'Assistant',
                //     rotation: it.rotation(),
                //     fill: '#ffffff',
                //     width: (it.width() * it.scaleX()),
                //     height:(it.height() * it.scaleY()),
                //     padding:20,
                //     align: 'center'
                // });
                // const rect2Main = new Konva.Rect({
                //     x: it.x(),
                //     y: it.y(),
                //     rotation: it.rotation(),
                //     strokeScaleEnabled: false,
                //     strokeWidth: 0,
                //     fill: '#757474',
                //     width: (it.width() * it.scaleX()),
                //     height:(it.height() * it.scaleY()),
                // });
                // this.layer.add(rect2Main);
                // this.layer.add(complexTextMain);
                it.destroy();
                if (nodes_layer_transfMain.length) {
                    nodes_layer_transfMain[0].destroy();
                }
                this.layer.draw();
                const nodes_layer_transf = newCopyLayer.find('#Transformer_' + it.id().replace('Rect_', ''));
                const nodes_layer_rect = newCopyLayer.find('#Rect_' + it.id().replace('Rect_', ''));

                const Ox = (blueWidth / 2) - (40 / this.aspectRatioW);
                const Oy = (blueHeight / 2) - (20 / this.aspectRatioW);
                const Rx = blueX + (Ox * Math.cos(blueAngle)) - (Oy * Math.sin(blueAngle));
                const Ry = blueY + (Ox * Math.sin(blueAngle)) + (Oy * Math.cos(blueAngle));

                const complexText = new Konva.Text({
                    x: Rx,
                    y: Ry,
                    text: 'הופרד',
                    fontSize: 20 / this.aspectRatioW,
                    fontFamily: 'Assistant',
                    rotation: angleComplete,
                    fill: '#02225C',
                    width: 80 / this.aspectRatioW,
                    height: 40 / this.aspectRatioW,
                    padding: 10 / this.aspectRatioW,
                    align: 'center'
                });
                const rectText = new Konva.Rect({
                    x: complexText.x(),
                    y: complexText.y(),
                    rotation: angleComplete,
                    stroke: '#02225C',
                    strokeWidth: 1 / this.aspectRatioW,
                    fill: 'transparent',
                    width: complexText.width(),
                    height: complexText.height(),
                    opacity: 1
                });
                const rect2 = new Konva.Rect({
                    x: blueX,
                    y: blueY,
                    rotation: angleComplete,
                    strokeScaleEnabled: false,
                    dash: [4 / this.aspectRatioW, 4 / this.aspectRatioW],
                    strokeWidth: 1 / this.aspectRatioW,
                    stroke: '#02225C',
                    fill: '#D9D9D9',
                    width: blueWidth,
                    height: blueHeight,
                    opacity: 0.7
                });
                newCopyLayer.add(rect2);
                newCopyLayer.add(rectText);
                newCopyLayer.add(complexText);
                if (nodes_layer_rect.length) {
                    nodes_layer_rect[0].destroy();
                }
                if (nodes_layer_transf.length) {
                    nodes_layer_transf[0].destroy();
                }
                newCopyLayer.draw();
            }
            this.showLoader = true;
            const stageDataURL = newCopyStage.toDataURL({
                pixelRatio: 1,
                quality: 1.0,
                mimeType: 'image/jpeg'
            });
            newCopyLayer.destroy();
            newCopyStage.destroy();
            // this.iX = 100;
            // this.iY = 100;
            // this.index = 0;
            // // console.log(stageDataURL);
            // this._imgSrc = stageDataURL;
            // this.loadBox();
            this.splitImages.emit({
                dataURLs,
                stageDataURL
            });
        }

    }

    addBox() {
        const box = new Konva.Rect({
            x: this.iX,
            y: this.iY,
            name: 'RectBox',
            id: 'Rect_' + this.index,
            perfectDrawEnabled: false,
            width: 100,
            height: 100,
            fill: 'transparent',
            stroke: '#022258',
            strokeWidth: 0,
            draggable: true,
            strokeScaleEnabled: false
        });
        box.on('mouseenter', () => {
            this.stage.container().style.cursor = 'move';
        });
        this.layer.add(box);
        box.cache();
        const tr2 = new Konva.Transformer({
            nodes: [box],
            id: 'Transformer_' + this.index,
            perfectDrawEnabled: false,
            keepRatio: false,
            rotateEnabled: true,
            borderEnabled: true,
            borderStroke: '#038ed6',
            borderStrokeWidth: 2,
            enabledAnchors: [
                'top-left',
                'top-center',
                'top-right',
                'middle-right',
                'middle-left',
                'bottom-left',
                'bottom-center',
                'bottom-right'
            ],
            anchorStroke: '#038ed6',
            anchorFill: '#ffffff',
            anchorSize: 15,
            anchorCornerRadius: 10,
            anchorStrokeWidth: 1,
            borderDash: [0],
            boundBoxFunc: (oldBoundBox, newBoundBox) => {
                if (Math.abs(newBoundBox.width) > this.size.stage_new_width) {
                    return oldBoundBox;
                }
                if (Math.abs(newBoundBox.height) > this.heightPopup) {
                    return oldBoundBox;
                }
                return newBoundBox;
            },
            dragBoundFunc: function (pos) {
                let newY = pos.y < 0 ? 0 : pos.y;
                let newX = pos.x < 0 ? 0 : pos.x;
                const widthBox = box.width() * box.scaleX();
                const heightBox = box.height() * box.scaleY();
                console.log(newY, newX, widthBox, heightBox);
            }
        });
        this.layer.add(tr2);
        this.layer.draw();
        if (this.index > 0) {
            const imageTrash = new Image();
            imageTrash.onload = () => {
                const deleteButton = new Konva.Rect({
                    x: 15,
                    y: 15,
                    fillPatternImage: imageTrash,
                    fillPatternRepeat: 'no-repeat',
                    width: 15,
                    height: 15,
                });
                tr2.add(deleteButton);
                deleteButton.on('click', () => {
                    if (this.index > 0) {
                        tr2.destroy();
                        box.destroy();
                        this.layer.draw();
                        this.iX -= 50;
                        this.iY -= 50;
                        this.index -= 1;
                    }
                });
                deleteButton.on('mouseenter', () => {
                    this.stage.container().style.cursor = 'pointer';
                });
            };
            imageTrash.src = '/assets/images/imageTrash.png';
        }

        tr2.on('transform', function () {
            const widthTransform = box.width() * box.scaleX();
            const heightTransform = box.height() * box.scaleY();
            if (widthTransform < 10) {
                tr2.stopTransform();
                const scaleX = 10 / box.width();
                box.scaleX(scaleX);
            }
            if (heightTransform < 10) {
                tr2.stopTransform();
                const scaleY = 10 / box.height();
                box.scaleY(scaleY);
            }
        });
        // tr2.cache();
        box.on('dragstart', () => {
            console.log('dragstart');
        });
        box.on('dragend', () => {
            console.log('dragend');
        });
        box.on('dragmove', () => {
            console.log('dragmove');
        });
        box.on('transformstart', () => {
            console.log('transform start');
        });
        box.on('transform', () => {
            console.log('transform');
        });
        box.on('transformend', () => {
            console.log('transform end');
        });
        tr2.findOne('.rotater').on('mouseenter', () => {
            this.stage.content.style.cursor = 'move';
        });
        const image = new Image();
        image.onload = drawImageActualSize; // Draw when image has loaded
        image.src = '/assets/images/arrows_rotate_icon.jpg';

        function drawImageActualSize() {
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 18;
            iconCanvas.height = 18;
            const ctx = iconCanvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 18, 18);
            ctx.drawImage(image, 2.5, 2.5, 12, 12);
            tr2.update = function () {
                Konva.Transformer.prototype.update.call(tr2);
                const rot23 = this.findOne('.rotater');
                rot23.fill(null);
                rot23.fillPatternImage(iconCanvas);
                rot23.fillPatternRepeat('no-repeat');
                // rot23.fillPatternOffset({x: -3, y: -2.5});
                rot23.width(18);
                rot23.height(18);
                rot23.x(rot23.attrs.x - 1);
                // rot23.y(rot23.attrs.y +5);
                const rot1 = this.findOne('.top-center');
                rot1.width(30);
                rot1.height(9);
                rot1.x(rot1.attrs.x - 7.5);
                rot1.y(rot1.attrs.y + 3);
                const rot2 = this.findOne('.middle-right');
                rot2.height(30);
                rot2.width(9);
                rot2.y(rot2.attrs.y - 7.5);
                rot2.x(rot2.attrs.x + 3);
                const rot3 = this.findOne('.bottom-center');
                rot3.width(30);
                rot3.height(9);
                rot3.x(rot3.attrs.x - 7.5);
                rot3.y(rot3.attrs.y + 3);
                const rot4 = this.findOne('.middle-left');
                rot4.height(30);
                rot4.width(9);
                rot4.y(rot4.attrs.y - 7.5);
                rot4.x(rot4.attrs.x + 3);
            };
            tr2.forceUpdate();
        }
    }

    add() {
        this.iX += 50;
        this.iY += 50;
        this.index += 1;
        this.addBox();
    }

    remove() {
        if (this.index > 0) {
            const node_layer = this.layer.find('#Rect_' + this.index);
            if (node_layer.length) {
                node_layer[0].destroy();
            }
            const nodes_layer = this.layer.find('#Transformer_' + this.index);
            if (nodes_layer.length) {
                nodes_layer[0].destroy();
            }
            this.layer.draw();
            this.iX -= 50;
            this.iY -= 50;
            this.index -= 1;
        }
    }

    ngOnDestroy() {
        if (this.stage) {
            console.log('--------destroy stage---------');
            this.stage.destroy();
        }
        if (this.layer) {
            console.log('--------destroy layer---------');
            this.layer.destroy();
        }
    }

    // public setPositionsSender(widthTransform, heightTransform, xBox, yBox) {
    //     widthTransform = widthTransform / this.imageScale;
    //     heightTransform = heightTransform / this.imageScale;
    //     // xBox = (this._sizeAllImg.pages[this.pageNo].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ?
    //     //     ((xBox - this._sizeAllImg.pages[this.pageNo]['spaceLeft'] + (this._scrollLeftWidth === 0 ? 0 : 5)) / this.imageScale)
    //     //     : ((xBox - (this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 15 + (this._scrollLeftWidth - 10))) / this.imageScale);
    //
    //     xBox =
    //         (xBox -
    //             ((this._sizeAllImg.width - this._sizeAllImg.pages[this.pageNo].width) /
    //                 2 +
    //                 (this._scrollLeftWidth > 7 ? 7 : 0))) /
    //         this.imageScale;
    //     yBox = yBox / this.imageScale;
    //     const mutatedVertices = [
    //         {
    //             x: xBox,
    //             y: yBox
    //         },
    //         {
    //             x: xBox + widthTransform,
    //             y: yBox
    //         },
    //         {
    //             x: xBox + widthTransform,
    //             y: yBox + heightTransform
    //         },
    //         {
    //             x: xBox,
    //             y: yBox + heightTransform
    //         }
    //     ];
    //     this.setPositions.emit({
    //         mutatedVertices: mutatedVertices
    //     });
    // }
}
