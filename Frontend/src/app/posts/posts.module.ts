// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from '../shared.module';

// Components
import { PostComponent } from './post/post.component';
import { PostsComponent } from './posts.component';
import { SubjectsComponent } from './subjects/subjects.component';
import { NewpeopleComponent } from './newpeople/newpeople.component';
import { PostListComponent } from './post-list/post-list.component';

// Routes
const POST_ROUTES: Routes = [
	{ pathMatch: 'full', path: 'all', component: PostsComponent } // FIX THIS SO EVERY PAGE IS ACCESSIBLE
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		RouterModule.forChild(POST_ROUTES)
	],
	exports: [
		RouterModule,
		PostComponent
	],
	declarations: [
		PostComponent,
		PostsComponent,
		SubjectsComponent,
		PostListComponent,
		NewpeopleComponent
	],
	providers: [
		
	]
})
export class PostsModule { }
