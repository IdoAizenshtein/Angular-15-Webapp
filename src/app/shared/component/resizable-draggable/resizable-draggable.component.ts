import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

const Konva = window['Konva'];
const canvg = window['canvg'];

@Component({
    selector: 'app-resizable-draggable',
    templateUrl: './resizable-draggable.component.html'
})
export class ResizableDraggableComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() public width: number;
    @Input() public height: number;
    @Input() public left: number;
    @Input() public top: number;
    @Input() public topFromFirst: number;
    @Input() public widthScreen: number;
    @Input() public heightScreen: number;
    // @Input('imageScale') public imageScale: number;
    @Input() public pageNo: number;
    @Input() public imageScale: number;
    @Output() setPositions = new EventEmitter<{ mutatedVertices: any }>();
    @Input() public pageImage: any;
    @Input() public offsetPageLeft: any;
    @Input() public offsetLocalLeft: any;
    @Input() public overOnCanvas: boolean = false;
    @Output() setActiveFieldFromExistingWordEvent = new EventEmitter<any>();
    @Output() setActiveFieldEvent = new EventEmitter<any>();
    public _changed: boolean = false;
    public _currentPage: number = 1;
    public _activeWordExist: any = false;
    public _visionResultsArr: any = [];
    public _wordsFieldsExist: any = [];
    public _sizeAllImg: any = false;
    public _scrollLeftWidth: number = 0;
    public _isPagesExist: boolean = false;
    public stage: any = null;
    public layer: any = null;
    public group: any = null;

    // @Input('imageScale')
    // set imageScaleParam(imageScale: any) {
    //     if (this.imageScale !== imageScale) {
    //         this.imageScale = imageScale;
    //         this.loadBox();
    //     } else {
    //         this.imageScale = imageScale;
    //     }
    // }

    @Input()
    set changed(changed: any) {
        if (this._changed !== changed) {
            console.log('changedParam');
            this._changed = changed;
            this.updateActiveWord();
        } else {
            this._changed = changed;
        }
    }

    @Input()
    set currentPage(currentPage: any) {
        if (this._currentPage !== currentPage) {
            console.log('currentPage', currentPage);
            this._currentPage = currentPage;
            // @ts-ignore
            const _this = this;
            if (
                this._sizeAllImg &&
                this._isPagesExist &&
                (this._visionResultsArr.length ||
                    this._wordsFieldsExist.length ||
                    this._activeWordExist)
            ) {
                if (this.stage && this.layer && this.group) {
                    const nodes = this.layer.find('#groupWords');
                    if (nodes.length) {
                        nodes.forEach((nd) => {
                            nd.destroy();
                        });
                    }
                    this.group = new Konva.Group({
                        id: 'groupWords',
                        x: 0,
                        y: 0
                    });
                    if (
                        this._visionResultsArr &&
                        this._visionResultsArr.length &&
                        this._sizeAllImg.pages &&
                        this._sizeAllImg.pages.length === this._visionResultsArr.length
                    ) {
                        this._visionResultsArr.forEach((wordsGr, idx) => {
                            // tslint:disable-next-line:no-shadowed-variable
                            const currentPageInside = this._currentPage - 1;
                            if (
                                this._sizeAllImg.pages[idx] &&
                                (idx === currentPageInside ||
                                    this._visionResultsArr[currentPageInside - 1] ||
                                    this._visionResultsArr[currentPageInside + 1])
                            ) {
                                const top = this._sizeAllImg.pages[idx]['top'];
                                const width = this._sizeAllImg.pages[idx]['width'];

                                wordsGr.forEach((word, index) => {
                                    const vertices = JSON.parse(JSON.stringify(word.vertices));
                                    vertices.forEach((it) => {
                                        it.y = it.y * this.imageScale + top;
                                        // it.x = (this._sizeAllImg.pages[idx].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ? (it.x * this.imageScale) + ((this._sizeAllImg.width - width) / 2) - (this._scrollLeftWidth === 0 ? 0 : 5)
                                        //     : this._sizeAllImg.pages[idx]['offsetPageLeft'] - 15 + (it.x * this.imageScale) + (this._scrollLeftWidth - 10);

                                        it.x =
                                            it.x * this.imageScale +
                                            (this._sizeAllImg.width - width) / 2 -
                                            (this._scrollLeftWidth > 7 ? 7 : 0);

                                        // it.y = (it.y * this.imageScale);
                                        // it.x = (it.x * this.imageScale);
                                    });
                                    const poly = new Konva.Line({
                                        class: 'polyLine',
                                        points: this.transformPoints(vertices),
                                        fill: 'transparent',
                                        stroke: '#022258',
                                        perfectDrawEnabled: false,
                                        lineCap: 'round',
                                        dash: 'none',
                                        cursor: 'move',
                                        strokeWidth: 0,
                                        closed: true
                                    });
                                    poly.on('mouseover', function (this: any) {
                                        // this.stroke('blue');
                                        this.strokeWidth(4);
                                        this.dash([10, 10]);
                                    });
                                    poly.on('mouseout', function (this: any) {
                                        this.strokeWidth(0);
                                        this.dash('none');
                                    });
                                    poly.on('click', function (this: any) {
                                        // @ts-ignore
                                        _this.setActiveFieldEvent.emit({
                                            i: idx,
                                            word: word,
                                            vertices: vertices
                                        });
                                        console.log('click', word, idx);
                                    });
                                    this.group.add(poly);
                                });
                            }
                        });
                    }
                    this.layer.add(this.group);
                } else {
                }
            }
        } else {
            this._currentPage = currentPage;
        }
    }

    @Input()
    set isPagesExist(isPagesExist: any) {
        // debugger
        if (this._isPagesExist !== isPagesExist) {
            console.log('isPagesExist');
            this._isPagesExist = isPagesExist;
            this.loadBox();
        } else {
            this._isPagesExist = isPagesExist;
        }
    }

    @Input()
    set activeWordExist(activeWordExist: any) {
        if (this._activeWordExist !== activeWordExist) {
            console.log('activeWordExist', this._activeWordExist, activeWordExist);
            this._activeWordExist = activeWordExist;
            this.updateActiveWord();
        } else {
            this._activeWordExist = activeWordExist;
        }
    }

    updateActiveWord() {
        // @ts-ignore
        const _this = this;
        if (
            this._sizeAllImg &&
            this._isPagesExist &&
            (this._visionResultsArr.length ||
                this._wordsFieldsExist.length ||
                this._activeWordExist)
        ) {
            if (this.stage && this.layer) {
                const nodes = this.layer.find('#box, #transformer');
                if (nodes.length) {
                    nodes.forEach((nd) => {
                        nd.destroy();
                    });
                }
                if (this._activeWordExist) {
                    // console.log('((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo][\'spaceLeft\'])', ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']));
                    // console.log('correctLeft', this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 10 + (this.left * this.imageScale));
                    // console.log('scrollLeftWidth: ', (this._scrollLeftWidth));
                    const box = new Konva.Rect({
                        // x: ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']) +(this._scrollLeftWidth),
                        // x: (this._sizeAllImg.pages[this.pageNo].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ? ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']) - (this._scrollLeftWidth === 0 ? 0 : 5)
                        //     : this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 15 + (this.left * this.imageScale) + (this._scrollLeftWidth - 10),
                        id: 'box',
                        x:
                            this.left * this.imageScale +
                            (this._sizeAllImg.width -
                                this._sizeAllImg.pages[this.pageNo].width) /
                            2 -
                            (this._scrollLeftWidth > 7 ? 7 : 0),
                        y: this.topFromFirst + this.top * this.imageScale,
                        perfectDrawEnabled: false,
                        width: this.width * this.imageScale,
                        height: this.height * this.imageScale,
                        fill: 'rgba(0,112,253,0.25)',
                        stroke: 'black',
                        strokeWidth: 0,
                        draggable: true,
                        dragBoundFunc: function (pos) {
                            let newY = pos.y < 0 ? 0 : pos.y;
                            let newX = pos.x < 0 ? 0 : pos.x;
                            const widthBox = box.width() * box.scaleX();
                            const heightBox = box.height() * box.scaleY();

                            // @ts-ignore
                            const indexOfCurentPage = _this._sizeAllImg.pages.findIndex(
                                (it, idx) => {
                                    // @ts-ignore
                                    const endOfPage =
                                        _this._sizeAllImg.pages[idx]['top'] +
                                        _this._sizeAllImg.pages[idx]['height'];
                                    return pos.y + heightBox <= endOfPage;
                                }
                            );
                            console.log(
                                '----------indexOfCurentPage--------',
                                indexOfCurentPage
                            );
                            // @ts-ignore
                            newY =
                                pos.y + heightBox >= _this.stage.height()
                                    ? _this.stage.height() - heightBox
                                    : newY;
                            // @ts-ignore
                            newX =
                                pos.x + widthBox >= _this.stage.width()
                                    ? _this.stage.width() - widthBox
                                    : newX;
                            // if (newY === 0 || newX === 0 || ((pos.y + heightBox) >= stage.height()) || ((pos.x + widthBox) >= stage.width())) {
                            //     box.stopDrag();
                            // }

                            // @ts-ignore
                            if (
                                _this._sizeAllImg.pages[indexOfCurentPage].width <
                                _this._sizeAllImg.width
                            ) {
                                // @ts-ignore
                                const xBox0 =
                                    (newX -
                                        ((_this._sizeAllImg.width -
                                                _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                            2 +
                                            (_this._scrollLeftWidth > 7 ? 7 : 0))) /
                                    _this.imageScale;
                                // @ts-ignore
                                const xBox1 = xBox0 + widthBox / _this.imageScale;
                                // @ts-ignore
                                if (
                                    xBox0 <= 0 ||
                                    xBox1 >=
                                    _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                    _this.imageScale
                                ) {
                                    if (xBox0 <= 0) {
                                        // @ts-ignore
                                        newX =
                                            ((_this._sizeAllImg.width -
                                                    _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                                2) *
                                            _this.imageScale +
                                            10;
                                        console.log('-------smaller left');
                                    }
                                    // @ts-ignore
                                    if (
                                        xBox1 >=
                                        _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                        _this.imageScale
                                    ) {
                                        // console.log(
                                        //     pos.x,
                                        //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] + _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] - widthBox
                                        // //     pos.x *  _this.imageScale,
                                        // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'],
                                        // //     (_this._sizeAllImg.pages[indexOfCurentPage]['width'] / _this.imageScale),
                                        // //     widthBox,
                                        // //     (widthBox / _this.imageScale),
                                        // //     (widthBox * _this.imageScale),
                                        // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] - widthBox,
                                        // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] - (widthBox / _this.imageScale),
                                        // // _this._sizeAllImg.pages[indexOfCurentPage],
                                        // //     ((((_this._sizeAllImg.width) - (_this._sizeAllImg.pages[indexOfCurentPage].width)) / 2))
                                        //     )
                                        // pos.x + widthBox - _this._sizeAllImg.pages[indexOfCurentPage]['width'] + _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] - widthBox
                                        // @ts-ignore
                                        newX =
                                            _this._sizeAllImg.pages[indexOfCurentPage]['width'] +
                                            _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] -
                                            widthBox;
                                        console.log('-------bigger right');
                                    }
                                }
                            }

                            return {
                                x: newX,
                                y: newY
                            };
                        }
                    });
                    this.layer.add(box);
                    box.cache();

                    const tr2 = new Konva.Transformer({
                        id: 'transformer',
                        nodes: [box],
                        perfectDrawEnabled: false,
                        keepRatio: false,
                        rotateEnabled: false,
                        borderEnabled: true,
                        borderStroke: '#022258',
                        borderStrokeWidth: 4,
                        anchorFill: 'transparent',
                        anchorStroke: 'transparent',
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
                        boundBoxFunc: function (oldBox, newBox) {
                            // @ts-ignore
                            const indexOfCurentPage = _this._sizeAllImg.pages.findIndex(
                                (it, idx) => {
                                    // @ts-ignore
                                    const endOfPage =
                                        _this._sizeAllImg.pages[idx]['top'] +
                                        _this._sizeAllImg.pages[idx]['height'];
                                    return newBox.y + newBox.height <= endOfPage;
                                }
                            );
                            console.log(
                                '!!!!!----------indexOfCurentPage--------',
                                indexOfCurentPage
                            );
                            // @ts-ignore
                            const xBox0 =
                                (newBox.x -
                                    ((_this._sizeAllImg.width -
                                            _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                        2 +
                                        (_this._scrollLeftWidth > 7 ? 7 : 0))) /
                                _this.imageScale;
                            // @ts-ignore
                            const xBox1 = xBox0 + newBox.width / _this.imageScale;

                            // @ts-ignore
                            if (
                                xBox0 <= 0 ||
                                xBox1 >=
                                _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                _this.imageScale
                            ) {
                                if (xBox0 <= 0) {
                                    console.log('!!!!!!!!-------smaller left');
                                    return oldBox;
                                }
                                // @ts-ignore
                                if (
                                    xBox1 >=
                                    _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                    _this.imageScale
                                ) {
                                    console.log('!!!!!!-------bigger right');
                                    return oldBox;
                                }
                            }

                            // @ts-ignore
                            if (
                                newBox.width + newBox.x >= _this.stage.width() ||
                                newBox.x <= 0
                            ) {
                                return oldBox;
                            }
                            // @ts-ignore
                            if (
                                newBox.height + newBox.y >= _this.stage.height() ||
                                newBox.y <= 0
                            ) {
                                return oldBox;
                            }
                            return newBox;
                        }
                    });
                    this.layer.add(tr2);
                    this.layer.draw();
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
                        // const widthTransform = box.width() * box.scaleX();
                        // const heightTransform = box.height() * box.scaleY();
                        // const xBox = box.x();
                        // const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        // this.setPositionsSender(widthTransform, heightTransform, xBox, yBox)
                    });
                    box.on('dragend', () => {
                        console.log('dragend');
                        const widthTransform = box.width() * box.scaleX();
                        const heightTransform = box.height() * box.scaleY();
                        const xBox = box.x();
                        const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        this.setPositionsSender(
                            widthTransform,
                            heightTransform,
                            xBox,
                            yBox
                        );
                    });
                    box.on('dragmove', () => {
                        console.log('dragmove');
                        const widthTransform = box.width() * box.scaleX();
                        const heightTransform = box.height() * box.scaleY();
                        const xBox = box.x();
                        const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        this.setPositionsSender(
                            widthTransform,
                            heightTransform,
                            xBox,
                            yBox
                        );
                    });
                    box.on('transformstart', () => {
                        console.log('transform start');
                        // const widthTransform = box.width() * box.scaleX();
                        // const heightTransform = box.height() * box.scaleY();
                        // const xBox = box.x();
                        // const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        // this.setPositionsSender(widthTransform, heightTransform, xBox, yBox)
                    });
                    box.on('transform', () => {
                        console.log('transform');
                        const widthTransform = box.width() * box.scaleX();
                        const heightTransform = box.height() * box.scaleY();
                        const xBox = box.x();
                        const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        this.setPositionsSender(
                            widthTransform,
                            heightTransform,
                            xBox,
                            yBox
                        );
                    });
                    box.on('transformend', () => {
                        console.log('transform end');
                        const widthTransform = box.width() * box.scaleX();
                        const heightTransform = box.height() * box.scaleY();
                        const xBox = box.x();
                        const yBox = box.y();
                        // console.log('widthTransform', widthTransform);
                        // console.log('heightTransform', heightTransform);
                        // console.log('xBox', xBox);
                        // console.log('yBox', yBox);
                        this.setPositionsSender(
                            widthTransform,
                            heightTransform,
                            xBox,
                            yBox
                        );
                    });

                    tr2.forceUpdate();
                }
            } else {
                //this.loadBox();
            }
        }
    }

    @Input()
    set visionResultsArr(visionResultsArr: any) {
        if (this._visionResultsArr !== visionResultsArr) {
            console.log('visionResultsArr');
            this._visionResultsArr = visionResultsArr;
            this.loadBox();
        } else {
            this._visionResultsArr = visionResultsArr;
        }
    }

    @Input()
    set wordsFieldsExist(wordsFieldsExist: any) {
        // if (this._wordsFieldsExist !== wordsFieldsExist) {
        //     this._wordsFieldsExist = wordsFieldsExist;
        //     this.loadBox();
        // } else {
        //     this._wordsFieldsExist = wordsFieldsExist;
        // }
    }

    @Input()
    set sizeAllImg(sizeAllImg: any) {
        if (JSON.stringify(this._sizeAllImg) !== JSON.stringify(sizeAllImg)) {
            console.log('---------------change sizeAllImg!!!!!!----------------');
            this._sizeAllImg = sizeAllImg;
            this.loadBox();
        } else {
            this._sizeAllImg = sizeAllImg;
        }
    }

    @Input()
    set scrollLeftWidth(scrollLeftWidth: any) {
        if (this._scrollLeftWidth !== scrollLeftWidth) {
            console.log('scrollLeftWidth');
            this._scrollLeftWidth = scrollLeftWidth;
            this.loadBox();
        } else {
            this._scrollLeftWidth = scrollLeftWidth;
        }
    }

    ngOnInit() {
        Konva.pixelRatio = 1;
    }

    ngAfterViewInit() {
        // console.log(this.width, this.height, this.left, this.top, this.imageScale);
        this.loadBox();
    }

    transformPoints(value: Array<{ x: number; y: number }>, args?: any): any {
        const arrPoints = [];
        if (Array.isArray(value) && value.length) {
            value.forEach((vertx) => {
                arrPoints.push(vertx.x !== undefined ? vertx.x : 0);
                arrPoints.push(vertx.y !== undefined ? vertx.y : 0);
            });
        }
        return arrPoints;
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
        if (this.group) {
            console.log('--------destroy group---------');
            this.group.destroy();
        }
        if (
            this._sizeAllImg &&
            this._isPagesExist &&
            (this._visionResultsArr.length ||
                this._wordsFieldsExist.length ||
                this._activeWordExist)
        ) {
            this.stage = new Konva.Stage({
                container: 'resizable-draggable',
                width: this.widthScreen,
                height: this.heightScreen
            });
            this.stage.container().style.cursor = 'pointer';
            // mergedWords[idx].verticesPoints =

            this.layer = new Konva.Layer({
                listening: true
            });
            this.stage.add(this.layer);

            this.group = new Konva.Group({
                id: 'groupWords',
                x: 0,
                y: 0
            });
            if (
                this._visionResultsArr &&
                this._visionResultsArr.length &&
                this._sizeAllImg.pages &&
                this._sizeAllImg.pages.length === this._visionResultsArr.length
            ) {
                this._visionResultsArr.forEach((wordsGr, idx) => {
                    const currentPage = this._currentPage - 1;
                    if (
                        this._sizeAllImg.pages[idx] &&
                        (idx === currentPage ||
                            this._visionResultsArr[currentPage - 1] ||
                            this._visionResultsArr[currentPage + 1])
                    ) {
                        const top = this._sizeAllImg.pages[idx]['top'];
                        const width = this._sizeAllImg.pages[idx]['width'];

                        wordsGr.forEach((word, index) => {
                            const vertices = JSON.parse(JSON.stringify(word.vertices));
                            vertices.forEach((it) => {
                                it.y = it.y * this.imageScale + top;
                                // it.x = (this._sizeAllImg.pages[idx].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ? (it.x * this.imageScale) + ((this._sizeAllImg.width - width) / 2) - (this._scrollLeftWidth === 0 ? 0 : 5)
                                //     : this._sizeAllImg.pages[idx]['offsetPageLeft'] - 15 + (it.x * this.imageScale) + (this._scrollLeftWidth - 10);

                                it.x =
                                    it.x * this.imageScale +
                                    (this._sizeAllImg.width - width) / 2 -
                                    (this._scrollLeftWidth > 7 ? 7 : 0);

                                // it.y = (it.y * this.imageScale);
                                // it.x = (it.x * this.imageScale);
                            });
                            const poly = new Konva.Line({
                                class: 'polyLine',
                                points: this.transformPoints(vertices),
                                fill: 'transparent',
                                stroke: '#022258',
                                perfectDrawEnabled: false,
                                lineCap: 'round',
                                dash: 'none',
                                cursor: 'move',
                                strokeWidth: 0,
                                closed: true
                            });
                            poly.on('mouseover', function (this: any) {
                                // this.stroke('blue');
                                this.strokeWidth(4);
                                this.dash([10, 10]);
                            });
                            poly.on('mouseout', function (this: any) {
                                this.strokeWidth(0);
                                this.dash('none');
                            });
                            poly.on('click', function () {
                                // @ts-ignore
                                _this.setActiveFieldEvent.emit({
                                    i: idx,
                                    word: word,
                                    vertices: vertices
                                });
                                console.log('click', word, idx);
                            });
                            this.group.add(poly);
                        });
                    }
                });
            }
            // console.log('this._wordsFieldsExist', this._wordsFieldsExist);
            // this._wordsFieldsExist.forEach((word, idx) => {
            //     if (word.fieldPosition.length && !this._wordsFieldsExist.some((it, index) => (index < idx && it.fieldPosition === word.fieldPosition))) {
            //         const top = this._sizeAllImg.pages[word.fieldPage - 1]['top'];
            //         const width = this._sizeAllImg.pages[word.fieldPage - 1]['width'];
            //         const fieldPosition = JSON.parse(JSON.stringify(word.fieldPosition));
            //         // const aaaa = ((this._sizeAllImg.width - width) / 2);
            //         // console.log('fieldPage: ', word.fieldPage - 1, '((this._sizeAllImg.width - width) / 2): ', aaaa, 'this.imageScale: ', this.imageScale);
            //
            //         fieldPosition.forEach(it => {
            //             it.y = (it.y * this.imageScale) + top;
            //             // it.x = (this._sizeAllImg.pages[word.fieldPage - 1].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ? (it.x * this.imageScale) + ((this._sizeAllImg.width - width) / 2) - (this._scrollLeftWidth === 0 ? 0 : 5)
            //             //     : this._sizeAllImg.pages[word.fieldPage - 1]['offsetPageLeft'] - 15 + (it.x * this.imageScale) + (this._scrollLeftWidth - 10);
            //             // it.y = (it.y * this.imageScale);
            //             //     console.log('have scroll x: ', this._scrollLeftWidth !== 0);
            //             //     console.log('is smaller than some of other: ', width < this._sizeAllImg.width);
            //             // // && (width < this._sizeAllImg.width)
            //             //     console.log('scrollLeftWidth', this._scrollLeftWidth);
            //             it.x = (it.x * this.imageScale) + ((((this._sizeAllImg.width) - (width)) / 2)) - (this._scrollLeftWidth > 7 ? 7 : 0);
            //         });
            //         const poly = new Konva.Line({
            //             points: this.transformPoints(fieldPosition),
            //             fill: 'rgba(0, 112, 253, 0.25)',
            //             stroke: '#022258',
            //             lineCap: 'round',
            //             dash: 'none',
            //             cursor: 'move',
            //             strokeWidth: 0,
            //             closed: true,
            //         });
            //         poly.on('mouseover', function () {
            //             this.strokeWidth(4);
            //             this.dash([10, 10]);
            //         });
            //         poly.on('mouseout', function () {
            //             this.strokeWidth(0);
            //             this.dash('none');
            //         });
            //         poly.on('click', function () {
            //             console.log('click', word);
            //             word.vertices = fieldPosition;
            //             // @ts-ignore
            //             _this.setActiveFieldFromExistingWordEvent.emit(word);
            //         });
            //         group.add(poly);
            //     }
            //
            // });
            this.layer.add(this.group);
            if (!this._activeWordExist) {
                this.layer.draw();
            }
            if (this._activeWordExist) {
                // console.log('((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo][\'spaceLeft\'])', ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']));
                // console.log('correctLeft', this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 10 + (this.left * this.imageScale));
                // console.log('scrollLeftWidth: ', (this._scrollLeftWidth));
                const box = new Konva.Rect({
                    // x: ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']) +(this._scrollLeftWidth),
                    // x: (this._sizeAllImg.pages[this.pageNo].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ? ((this.left) * this.imageScale) + (this._sizeAllImg.pages[this.pageNo]['spaceLeft']) - (this._scrollLeftWidth === 0 ? 0 : 5)
                    //     : this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 15 + (this.left * this.imageScale) + (this._scrollLeftWidth - 10),

                    x:
                        this.left * this.imageScale +
                        (this._sizeAllImg.width - this._sizeAllImg.pages[this.pageNo].width) /
                        2 -
                        (this._scrollLeftWidth > 7 ? 7 : 0),
                    y: this.topFromFirst + this.top * this.imageScale,
                    perfectDrawEnabled: false,
                    width: this.width * this.imageScale,
                    height: this.height * this.imageScale,
                    fill: 'rgba(0,112,253,0.25)',
                    stroke: 'black',
                    strokeWidth: 0,
                    draggable: true,
                    dragBoundFunc: function (pos) {
                        let newY = pos.y < 0 ? 0 : pos.y;
                        let newX = pos.x < 0 ? 0 : pos.x;
                        const widthBox = box.width() * box.scaleX();
                        const heightBox = box.height() * box.scaleY();

                        // @ts-ignore
                        const indexOfCurentPage = _this._sizeAllImg.pages.findIndex(
                            (it, idx) => {
                                // @ts-ignore
                                const endOfPage =
                                    _this._sizeAllImg.pages[idx]['top'] +
                                    _this._sizeAllImg.pages[idx]['height'];
                                return pos.y + heightBox <= endOfPage;
                            }
                        );
                        console.log(
                            '----------indexOfCurentPage--------',
                            indexOfCurentPage
                        );
                        // @ts-ignore
                        newY =
                            pos.y + heightBox >= _this.stage.height()
                                ? _this.stage.height() - heightBox
                                : newY;
                        // @ts-ignore
                        newX =
                            pos.x + widthBox >= _this.stage.width()
                                ? _this.stage.width() - widthBox
                                : newX;
                        // if (newY === 0 || newX === 0 || ((pos.y + heightBox) >= stage.height()) || ((pos.x + widthBox) >= stage.width())) {
                        //     box.stopDrag();
                        // }

                        // @ts-ignore
                        if (
                            _this._sizeAllImg.pages[indexOfCurentPage].width <
                            _this._sizeAllImg.width
                        ) {
                            // @ts-ignore
                            const xBox0 =
                                (newX -
                                    ((_this._sizeAllImg.width -
                                            _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                        2 +
                                        (_this._scrollLeftWidth > 7 ? 7 : 0))) /
                                _this.imageScale;
                            // @ts-ignore
                            const xBox1 = xBox0 + widthBox / _this.imageScale;
                            // @ts-ignore
                            if (
                                xBox0 <= 0 ||
                                xBox1 >=
                                _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                _this.imageScale
                            ) {
                                if (xBox0 <= 0) {
                                    // @ts-ignore
                                    newX =
                                        ((_this._sizeAllImg.width -
                                                _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                            2) *
                                        _this.imageScale +
                                        10;
                                    console.log('-------smaller left');
                                }
                                // @ts-ignore
                                if (
                                    xBox1 >=
                                    _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                    _this.imageScale
                                ) {
                                    // console.log(
                                    //     pos.x,
                                    //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] + _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] - widthBox
                                    // //     pos.x *  _this.imageScale,
                                    // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'],
                                    // //     (_this._sizeAllImg.pages[indexOfCurentPage]['width'] / _this.imageScale),
                                    // //     widthBox,
                                    // //     (widthBox / _this.imageScale),
                                    // //     (widthBox * _this.imageScale),
                                    // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] - widthBox,
                                    // //     _this._sizeAllImg.pages[indexOfCurentPage]['width'] - (widthBox / _this.imageScale),
                                    // // _this._sizeAllImg.pages[indexOfCurentPage],
                                    // //     ((((_this._sizeAllImg.width) - (_this._sizeAllImg.pages[indexOfCurentPage].width)) / 2))
                                    //     )
                                    // pos.x + widthBox - _this._sizeAllImg.pages[indexOfCurentPage]['width'] + _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] - widthBox
                                    // @ts-ignore
                                    newX =
                                        _this._sizeAllImg.pages[indexOfCurentPage]['width'] +
                                        _this._sizeAllImg.pages[indexOfCurentPage]['spaceLeft'] -
                                        widthBox;
                                    console.log('-------bigger right');
                                }
                            }
                        }

                        return {
                            x: newX,
                            y: newY
                        };
                    }
                });
                this.layer.add(box);
                box.cache();

                const tr2 = new Konva.Transformer({
                    nodes: [box],
                    perfectDrawEnabled: false,
                    keepRatio: false,
                    rotateEnabled: false,
                    borderEnabled: true,
                    borderStroke: '#022258',
                    borderStrokeWidth: 4,
                    anchorFill: 'transparent',
                    anchorStroke: 'transparent',
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
                    boundBoxFunc: function (oldBox, newBox) {
                        // @ts-ignore
                        const indexOfCurentPage = _this._sizeAllImg.pages.findIndex(
                            (it, idx) => {
                                // @ts-ignore
                                const endOfPage =
                                    _this._sizeAllImg.pages[idx]['top'] +
                                    _this._sizeAllImg.pages[idx]['height'];
                                return newBox.y + newBox.height <= endOfPage;
                            }
                        );
                        console.log(
                            '!!!!!----------indexOfCurentPage--------',
                            indexOfCurentPage
                        );
                        // @ts-ignore
                        const xBox0 =
                            (newBox.x -
                                ((_this._sizeAllImg.width -
                                        _this._sizeAllImg.pages[indexOfCurentPage].width) /
                                    2 +
                                    (_this._scrollLeftWidth > 7 ? 7 : 0))) /
                            _this.imageScale;
                        // @ts-ignore
                        const xBox1 = xBox0 + newBox.width / _this.imageScale;

                        // @ts-ignore
                        if (
                            xBox0 <= 0 ||
                            xBox1 >=
                            _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                            _this.imageScale
                        ) {
                            if (xBox0 <= 0) {
                                console.log('!!!!!!!!-------smaller left');
                                return oldBox;
                            }
                            // @ts-ignore
                            if (
                                xBox1 >=
                                _this._sizeAllImg.pages[indexOfCurentPage]['width'] /
                                _this.imageScale
                            ) {
                                console.log('!!!!!!-------bigger right');
                                return oldBox;
                            }
                        }

                        // @ts-ignore
                        if (
                            newBox.width + newBox.x >= _this.stage.width() ||
                            newBox.x <= 0
                        ) {
                            return oldBox;
                        }
                        // @ts-ignore
                        if (
                            newBox.height + newBox.y >= _this.stage.height() ||
                            newBox.y <= 0
                        ) {
                            return oldBox;
                        }
                        return newBox;
                    }
                });
                this.layer.add(tr2);
                this.layer.draw();
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
                    // const widthTransform = box.width() * box.scaleX();
                    // const heightTransform = box.height() * box.scaleY();
                    // const xBox = box.x();
                    // const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    // this.setPositionsSender(widthTransform, heightTransform, xBox, yBox)
                });
                box.on('dragend', () => {
                    console.log('dragend');
                    const widthTransform = box.width() * box.scaleX();
                    const heightTransform = box.height() * box.scaleY();
                    const xBox = box.x();
                    const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    this.setPositionsSender(widthTransform, heightTransform, xBox, yBox);
                });
                box.on('dragmove', () => {
                    console.log('dragmove');
                    const widthTransform = box.width() * box.scaleX();
                    const heightTransform = box.height() * box.scaleY();
                    const xBox = box.x();
                    const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    this.setPositionsSender(widthTransform, heightTransform, xBox, yBox);
                });
                box.on('transformstart', () => {
                    console.log('transform start');
                    // const widthTransform = box.width() * box.scaleX();
                    // const heightTransform = box.height() * box.scaleY();
                    // const xBox = box.x();
                    // const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    // this.setPositionsSender(widthTransform, heightTransform, xBox, yBox)
                });
                box.on('transform', () => {
                    console.log('transform');
                    const widthTransform = box.width() * box.scaleX();
                    const heightTransform = box.height() * box.scaleY();
                    const xBox = box.x();
                    const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    this.setPositionsSender(widthTransform, heightTransform, xBox, yBox);
                });
                box.on('transformend', () => {
                    console.log('transform end');
                    const widthTransform = box.width() * box.scaleX();
                    const heightTransform = box.height() * box.scaleY();
                    const xBox = box.x();
                    const yBox = box.y();
                    // console.log('widthTransform', widthTransform);
                    // console.log('heightTransform', heightTransform);
                    // console.log('xBox', xBox);
                    // console.log('yBox', yBox);
                    this.setPositionsSender(widthTransform, heightTransform, xBox, yBox);
                });
            }
        }
    }

    public setPositionsSender(widthTransform, heightTransform, xBox, yBox) {
        widthTransform = widthTransform / this.imageScale;
        heightTransform = heightTransform / this.imageScale;
        // xBox = (this._sizeAllImg.pages[this.pageNo].width >= this._sizeAllImg.width) || this._scrollLeftWidth === 0 ?
        //     ((xBox - this._sizeAllImg.pages[this.pageNo]['spaceLeft'] + (this._scrollLeftWidth === 0 ? 0 : 5)) / this.imageScale)
        //     : ((xBox - (this._sizeAllImg.pages[this.pageNo]['offsetPageLeft'] - 15 + (this._scrollLeftWidth - 10))) / this.imageScale);

        xBox =
            (xBox -
                ((this._sizeAllImg.width - this._sizeAllImg.pages[this.pageNo].width) /
                    2 +
                    (this._scrollLeftWidth > 7 ? 7 : 0))) /
            this.imageScale;
        yBox = yBox / this.imageScale;
        const mutatedVertices = [
            {
                x: xBox,
                y: yBox
            },
            {
                x: xBox + widthTransform,
                y: yBox
            },
            {
                x: xBox + widthTransform,
                y: yBox + heightTransform
            },
            {
                x: xBox,
                y: yBox + heightTransform
            }
        ];
        this.setPositions.emit({
            mutatedVertices: mutatedVertices
        });
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
        if (this.group) {
            console.log('--------destroy group---------');
            this.group.destroy();
        }
    }
}
