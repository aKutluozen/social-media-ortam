import { SearchComponent } from './navigation/search/search.component';
import { NgModule }  from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Note:
// Declare sub main page routing components here so the modules can render the sub routes in them
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
	declarations: [
		SearchComponent
	],
	exports: [
        SearchComponent
	]
})
export class SharedModule { }
