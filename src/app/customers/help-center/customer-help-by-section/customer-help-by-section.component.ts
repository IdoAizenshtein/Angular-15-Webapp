import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {CustomersHelpCenterComponent} from '../customers-help-center/customers-help-center.component';
import {QuestionData, Searchable, TermData, VideoData} from '../shared/searchable.model';
import Player from '@vimeo/player';
import {HelpCenterService} from '../help-center.service';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    selector: 'app-customer-help-by-section',
    templateUrl: './customer-help-by-section.component.html',
    styles: [],
    encapsulation: ViewEncapsulation.None
})
export class CustomerHelpBySectionComponent
    implements OnInit, OnDestroy, AfterViewInit {
    private section$: Observable<string>;
    sectionQuestions$: Observable<Array<QuestionData>>;
    sectionTerms$: Observable<Array<TermData>>;
    sectionVideo$: Observable<VideoData[]>;

    private player: Player;
    private currentVideo: VideoData;

    @ViewChild('playerContainer')
    set playerContainer(el: ElementRef) {
        if (!el) {
            if (this.player) {
                this.player.destroy();
                this.player = null;
            }
        }
    }

    @ViewChildren('displayedTerm') displayedTermRefs: QueryList<ElementRef>;
    @ViewChildren('displayedFaq') displayedFaqRefs: QueryList<ElementRef>;

    private readonly destroyed$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    constructor(
        private route: ActivatedRoute,
        public customersHelpCenterComponent: CustomersHelpCenterComponent,
        private helpCenterService: HelpCenterService
    ) {
    }

    ngOnInit() {
        this.section$ = this.route.paramMap.pipe(
            map((paramMap) => paramMap.get('section'))
        );

        this.sectionQuestions$ = combineLatest(
            [
                this.customersHelpCenterComponent.faqList$,
                this.section$
            ]
        ).pipe(
            map(([faqList, section]) => {
                    if (section === 'overview') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('general');
                    }
                    if (section === 'bankAccount') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('account');
                    }
                    if (section === 'creditCard') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('credit');
                    }
                    if (section === 'checks') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('check');
                    }
                    if (section === 'slika') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('slika');
                    }
                    if (section === 'cashflow') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('daily tazrim');
                    }
                    if (section === 'bankmatch') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('bank match');
                    }
                    if (section === 'fixedMovements') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('kvua');
                    }
                    if (section === 'mutavim') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('mutav');
                    }
                    if (section === 'budget') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('budget');
                    }
                    if (section === 'video') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('all videos');
                    }
                    if (section === 'faq') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('all questions');
                    }
                    // if (section === 'terms') {
                    //     this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('general');
                    // }

                    if (section === 'settings') {
                        this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('settings');
                    }
                    // if (section === 'blog') {
                    //     this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('general');
                    // }
                    // if (section === 'hashInvoice') {
                    //     this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('general');
                    // }
                    // if (section === 'biziboxInvioce') {
                    //     this.customersHelpCenterComponent.sharedComponent.mixPanelEvent('general');
                    // }
                    return faqList.filter((faq) =>
                        faq.screens.some((scr) => scr.screenName === section)
                    );
                }
            )
        );

        this.sectionTerms$ = combineLatest(
            [
                this.customersHelpCenterComponent.termsList$,
                this.section$
            ]
        ).pipe(
            map(([termsList, section]) =>
                termsList.filter((term) =>
                    term.screens.some((scr) => scr.screenName === section)
                )
            )
        );

        this.sectionVideo$ = combineLatest(
            [
                this.customersHelpCenterComponent.videosList$,
                this.section$
            ]
        ).pipe(
            // tap(() => {
            //     if (this.player) {
            //         requestAnimationFrame(() => {
            //             this.player.destroy();
            //             this.player = null;
            //         });
            //         // this.player.destroy();
            //         // this.player = null;
            //     }
            // }),
            map(([videos, section]) =>
                videos.filter((vid) =>
                    vid.screens.some((scr) => scr.screenName === section)
                )
            ),
            publishRef
        );

        // this.customersHelpCenterComponent.filteredQuestions$ = this.sectionQuestions$;
        // this.customersHelpCenterComponent.filteredTerms$ = this.sectionTerms$;
    }

    ngAfterViewInit(): void {
        this.sectionVideo$.subscribe((videos) => {
            if (Array.isArray(videos) && videos.length) {
                this.prepareForWatch(videos[0]);
            }
        });

        this.helpCenterService.navigateSearchable$
            .pipe(
                tap((searchable) => ((<any>searchable).expanded = true)),
                map((searchable) => {
                    let liToScrollTo: ElementRef = null;
                    if (searchable instanceof TermData || (<any>searchable).subject) {
                        liToScrollTo = this.displayedTermRefs.find(
                            (item) =>
                                (item.nativeElement as HTMLElement).id ===
                                (<any>searchable).termId
                        );
                    } else if (
                        searchable instanceof QuestionData ||
                        (<any>searchable).question
                    ) {
                        liToScrollTo = this.displayedFaqRefs.find(
                            (item) =>
                                (item.nativeElement as HTMLElement).id ===
                                (<any>searchable).questionId
                        );
                    }
                    return liToScrollTo;
                }),
                takeUntil(this.destroyed$)
            )
            .subscribe((elRef: ElementRef) => {
                if (elRef) {
                    (elRef.nativeElement as HTMLElement).scrollIntoView({
                        block: 'start'
                    });
                }
            });
    }

    searchableTrackbyFn<T extends Searchable>(idx: number, searchable: T) {
        if (searchable instanceof TermData || (<any>searchable).subject) {
            return (<any>searchable).termId;
        } else if (
            searchable instanceof QuestionData ||
            (<any>searchable).question
        ) {
            return (<any>searchable).questionId;
        }
        return String(idx);
    }

    prepareForWatch(vid: VideoData) {
        this.currentVideo = vid;
        vid.vimeoData.subscribe((vimeoData) => {
            if (!this.player) {
                this.player = new Player('vimeo-player-inline', {
                    id: vimeoData.video_id, // +val.url, // id: 202742042, // 231377016,
                    // maxwidth: this.vimeoData.width, // 460,
                    autoplay: false,
                    maxwidth: vimeoData.width,
                    maxheight: vimeoData.height,
                    responsive: true
                });
            } else {
                this.player.loadVideo(vimeoData.video_id);
            }
        });
    }

    scrollVideo(factor: number, videos: VideoData[]) {
        let currVideoIndex = videos.indexOf(this.currentVideo);
        if (currVideoIndex < 0) {
            return;
        }

        currVideoIndex += factor;
        if (currVideoIndex < 0) {
            this.prepareForWatch(videos[videos.length - 1]);
        } else if (currVideoIndex === videos.length) {
            this.prepareForWatch(videos[0]);
        } else {
            this.prepareForWatch(videos[currVideoIndex]);
        }
    }
}
