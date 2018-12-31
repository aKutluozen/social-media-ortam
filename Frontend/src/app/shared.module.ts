import { SearchComponent } from './navigation/search/search.component';
import { FooterComponent } from './footer/footer.component';
import { UserCardComponent } from './user/user-card/user-card.component';
import { NgModule }  from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';

// Note:
// Declare sub main page routing components here so the modules can render the sub routes in them
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
	declarations: [
        SearchComponent,
        FooterComponent,
        UserCardComponent
	],
	exports: [
        SearchComponent,
        FooterComponent,
        UserCardComponent
	]
})
export class SharedModule { }
