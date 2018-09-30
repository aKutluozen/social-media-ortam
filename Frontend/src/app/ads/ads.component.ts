import { Component, OnInit, OnDestroy } from "@angular/core";

import { Ad } from "./ad.model";
import { AdsService } from "./ads.service";
import { ModalService } from "app/modals/modal.service";
import { AuthService } from "app/auth/auth.service";
import { Subscription } from "rxjs";
import { GlobalService } from "../globals.service";

@Component({
    selector: 'app-ads',
    templateUrl: './ads.component.html'
})
export class AdsComponent implements OnInit, OnDestroy {

    constructor(
        public adsService: AdsService,
        private modal: ModalService,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    public adAmount: number = 0;
    public category: string = '';
    private adSubscription: Subscription;
    private adSubscriptionWithInterval: Subscription = null;
    private adSubscriptionCategories: Subscription = null;

    private adLoadInterval: any = {};

    // Initialize ads, get all of them
    ngOnInit() {
        this.category = 'tasit';
        this.adAmount = 0;
        this.loadAds();
        this.adLoadInterval = window.setInterval(() => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                this.loadMore();
            }
        }, 1000);
    }

    view(ad) {
        this.modal.showAdViewModal(ad);
    }

    loadAds() {
        this.adSubscription = this.adsService.getAds(this.adAmount, this.category).subscribe(
            (ads: Ad[]) => {
                this.adsService.ads = ads.slice();
            }, error => {
                this.adSubscription.unsubscribe();
                this.modal.handleError('Paylasimlari goruntulerken bir sorun olustu', error);
            });
    }

    ngOnDestroy() {
        window.clearInterval(this.adLoadInterval);
        if (this.adSubscription) this.adSubscription.unsubscribe();
        if (this.adSubscriptionCategories) this.adSubscriptionCategories.unsubscribe();
        if (this.adSubscriptionWithInterval) this.adSubscriptionWithInterval.unsubscribe();
    }

    // Get ads by category
    filterByCategory(category) {
        this.category = category;
        this.adAmount = 0;
        this.adSubscriptionCategories = this.adsService.getAds(this.adAmount, category).subscribe((ads: Ad[]) => {
            this.adsService.ads = ads.slice();
        }, error => {
            this.adSubscriptionCategories.unsubscribe();
            this.modal.handleError('Konulari goruntulerken bir sorun olustu', error);
        });
    }

    loadMore() {
        this.adAmount += 5;
        this.adSubscriptionWithInterval = this.adsService.getAds(this.adAmount, this.category).subscribe((moreAds: Ad[]) => {
            if (moreAds.length > 0) {
                this.adsService.ads = this.adsService.ads.concat(moreAds);
            } else {
                window.clearInterval(this.adLoadInterval);
            }
        }, error => {
            this.adSubscriptionWithInterval.unsubscribe();
            window.clearInterval(this.adLoadInterval);
            this.modal.handleError('Konulari goruntulerken bir sorun olustu 123', error);
        });
    }

    openAdWindow() {
        this.modal.showNewAdModal();
    }
}