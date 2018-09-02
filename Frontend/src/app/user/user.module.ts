// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from '../shared.module';

// Components
import { UserComponent } from './user.component';

// Route protection
import { AuthGuard } from "app/auth/auth.guard";
import { PostsModule } from 'app/posts/posts.module';
import { ImageCropperModule } from 'ngx-image-cropper';

// Routes
const USER_ROUTES: Routes = [
	{ pathMatch: 'prefix', path: 'me', component: UserComponent, canActivate: [AuthGuard] }
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		PostsModule,
		RouterModule.forChild(USER_ROUTES),
		ImageCropperModule,
		SharedModule
	],
	exports: [
		RouterModule
	],
	declarations: [
		UserComponent
	],
	providers: [
		AuthGuard
	]
})
export class UserModule { }
