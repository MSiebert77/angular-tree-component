import { Component, ViewChild } from '@angular/core';
import { AppsettingsService } from './appsettingsService';
import { TodoItemFlatNode, TodoItemNode } from './material-tree/datamodel/dataModel';
import { MaterialTreeComponent } from './material-tree/material-tree.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'material-tree';
  draggingItem: TodoItemFlatNode[] = undefined;
  @ViewChild("treeTarget", { static: true }) treeTarget: MaterialTreeComponent;
  @ViewChild("treeSource", { static: true }) treeSource: MaterialTreeComponent;

  constructor(private appsettingsService: AppsettingsService) {

    
  }
  dragStarted(event) {
    this.draggingItem = event;
  }

  dragStopped() {
    console.log("AppComponent: dragStopped");
    this.draggingItem = undefined;
  }

  add() {
    this.treeTarget.addNewItem();
  }
}
