import { Component, OnInit, Input, OnDestroy } from "@angular/core";

import { Post } from "../post.model";
import { PostService } from "../posts.service";
import { AuthService } from "app/auth/auth.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-subjects',
    templateUrl: './subjects.component.html',
    styleUrls: ['subjects.component.css']
})
export class SubjectsComponent implements OnInit, OnDestroy {    
    @Input() postListRef;

    constructor(
        public postService: PostService,
        public auth: AuthService
    ) { }

    public subjects: string[];
    private subscription: Subscription;

    ngOnInit() {
        this.subscription = this.postService.getSubjects().subscribe((subjects) => {
            this.subjects = subjects;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}