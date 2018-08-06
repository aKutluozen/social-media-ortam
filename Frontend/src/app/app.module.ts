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
import { SearchComponent } from './navigation/search/search.component';
import { ImagemodalComponent } from './modals/imagemodal/imagemodal.component';
import { InputmodalComponent } from './modals/inputmodal/inputmodal.component';
import { UsermodalComponent } from './modals/usermodal/usermodal.component';
import { QuestionmodalComponent } from './modals/questionmodal/questionmodal.component';
import { ComplaintmodalComponent } from './modals/complaintmodal/complaintmodal.component';
import { PostmodalComponent } from './modals/postmodal/postmodal.component';
import { PostviewmodalComponent } from './modals/postviewmodal/postviewmodal.component';
import { AuthComponent } from './auth/auth.component';
import { PostsComponent } from './posts/posts.component';
import { ChatComponent } from './navigation/inbox/chat/chat.component';
import { ChatPageComponent } from './navigation/inbox/chat/chat-page/chat.page.component';
import { AdminComponent } from './admin/admin.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { EmojiPickerModule } from 'ng-emoji-picker';

// Services
import { AuthService } from './auth/auth.service';
import { ModalService } from './modals/modal.service';
import { InboxService } from './navigation/inbox/inbox.service';
import { UserService } from './user/user.service';
import { PostService } from 'app/posts/posts.service';
import { AuthGuard } from './auth/auth.guard';
import { ChatService } from 'app/navigation/inbox/chat/chat.service';
import { GlobalService } from 'app/globals.service';
import { PostsModule } from './posts/posts.module';
import { InboxModule } from './navigation/inbox/inbox.module';

// Main routes - Lazily loaded
const APP_ROUTES: Routes = [
	{ pathMatch: 'full', path: '', redirectTo: '/posts/all' },
	{ path: 'posts/all', component: PostsComponent, canActivate: [AuthGuard] },
	{ path: 'auth', component: AuthComponent, loadChildren: 'app/auth/auth.module#AuthModule' },
	{ path: 'profile', loadChildren: 'app/user/user.module#UserModule' },
	{ path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
	{ path: 'chat', component: ChatPageComponent, canActivate: [AuthGuard] },
	{ pathMatch: 'full', path: '**', redirectTo: '/posts/all' }
];

// Note:
// Declare sub main page routing components here so the modules can render the sub routes in them
@NgModule({
	declarations: [
		AppComponent,
		NavigationComponent,
		ErrorComponent,
		WarningComponent,
		SearchComponent,
		ImagemodalComponent,
		InputmodalComponent,
		UsermodalComponent,
		ComplaintmodalComponent,
		QuestionmodalComponent,
		PostmodalComponent,
		PostviewmodalComponent,
		AuthComponent,
		AdminComponent
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot(APP_ROUTES),
		FormsModule,
		HttpModule,
		ReactiveFormsModule,
		PostsModule,
		ImageCropperModule,
		InboxModule,
		EmojiPickerModule
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
		GlobalService
	],
	bootstrap: [
		AppComponent
	]
})
export class AppModule { }
