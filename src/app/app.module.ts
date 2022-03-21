import { DemoMaterialModule } from './material-module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialTreeComponent } from './material-tree/material-tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppsettingsService } from './appsettingsService';

@NgModule({
  declarations: [
    AppComponent,
    MaterialTreeComponent
  ],
  imports: [
    BrowserModule,
    DemoMaterialModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [AppsettingsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
