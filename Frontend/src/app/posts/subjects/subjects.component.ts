import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { PostService } from "../posts.service";
import { AuthService } from "app/auth/auth.service";
import { Subscription } from "rxjs";
import { MultiLanguageService } from "../../language.service";

@Component({
    selector: 'app-subjects',
    templateUrl: './subjects.component.html'
})
export class SubjectsComponent implements OnInit, OnDestroy {    
    @Input() postListRef;

    constructor(
        public postService: PostService,
        public auth: AuthService,
        public lang: MultiLanguageService
    ) { }

    public subjects: string[];
    private subscription: Subscription;

    ngOnInit() {
        this.subscription = this.postService.getSubjects().subscribe((data) => {
            this.subjects = data.data;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}