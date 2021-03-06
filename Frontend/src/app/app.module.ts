// Main modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from "@angular/router";

// Components
import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ErrorComponent } from './modals/error/error.component';
import { WarningComponent } from './modals/warning/warning.component';
import { ImagemodalComponent } from './modals/image/imagemodal.component';
import { InputmodalComponent } from './modals/input/inputmodal.component';
import { CreditmodalComponent } from './modals/credit/creditmodal.component';
import { UsermodalComponent } from './modals/user/usermodal.component';
import { QuestionmodalComponent } from './modals/question/questionmodal.component';
import { ComplaintmodalComponent } from './modals/complaint/complaintmodal.component';
import { PostmodalComponent } from './modals/post/postmodal.component';
import { PostviewmodalComponent } from './modals/postview/postviewmodal.component';
import { AdviewmodalComponent } from './modals/adview/adviewmodal.component';
import { AdmodalComponent } from './modals/ad/admodal.component';
import { AuthComponent } from './auth/auth.component';
import { PostsComponent } from './posts/posts.component';
import { AdminComponent } from './admin/admin.component';
import { ImageCropperModule } from 'ngx-image-cropper';

import { SharedModule } from './shared.module';

// Services
import { AuthService } from './auth/auth.service';
import { ModalService } from './modals/modal.service';
import { InboxService } from './navigation/inbox/inbox.service';
import { UserService } from './user/user.service';
import { PostService } from 'app/posts/posts.service';
import { AuthGuard } from './auth/auth.guard';
import { ChatService } from 'app/navigation/inbox/chat/chat.service';
import { GlobalService } from 'app/globals.service';
import { MultiLanguageService } from 'app/language.service';
import { AdsService } from 'app/ads/ads.service';
import { PostsModule } from './posts/posts.module';
import { InboxModule } from './navigation/inbox/inbox.module';
import { AdsModule } from './ads/ads.module';
import { LegalComponent } from './legal/legal.component';
import { GdprComponent } from './gdpr/gdpr.component';

// Main routes - Lazily loaded
const APP_ROUTES: Routes = [
	{ path: '', pathMatch: 'full', component: PostsComponent},
	{ path: 'legal', component: LegalComponent },
	{ path: 'gdpr', component: GdprComponent },
	{ path: 'auth', component: AuthComponent, loadChildren: 'app/auth/auth.module#AuthModule' },
	{ path: 'profile', loadChildren: 'app/user/user.module#UserModule' },
	{ path: 'ads', loadChildren: 'app/ads/ads.module#AdsModule' },
	{ path: 'admin', component: AdminComponent },
	//{ path: '**', redirectTo: '/posts/all' }
];

// Note:
// Declare sub main page routing components here so the modules can render the sub routes in them
@NgModule({
	declarations: [
		AppComponent,
		NavigationComponent,
		ErrorComponent,
		WarningComponent,
		ImagemodalComponent,
		InputmodalComponent,
		UsermodalComponent,
		ComplaintmodalComponent,
		QuestionmodalComponent,
		AdmodalComponent,
		LegalComponent,
		GdprComponent,
		PostmodalComponent,
		PostviewmodalComponent,
		CreditmodalComponent,
		AdviewmodalComponent,
		AuthComponent,
		AdminComponent
	],
	imports: [
		SharedModule,
		BrowserModule,
		RouterModule.forRoot(APP_ROUTES),
		FormsModule,
		HttpModule,
		ReactiveFormsModule,
		PostsModule,
		ImageCropperModule,
		InboxModule,
		AdsModule
	],
	exports: [
		RouterModule
	],
	providers: [
		AuthService,
		ModalService,
		AuthGuard,
		InboxService,
		UserService,
		PostService,
		ChatService,
		MultiLanguageService,
		AdsService,
		GlobalService
	],
	bootstrap: [
		AppComponent
	]
})
export class AppModule { }
