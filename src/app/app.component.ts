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

  add() {
    if (this.treeTarget.activeNodes.length != 1) {
      return;
    } else {
      this.treeTarget.addNewItem();
    }
  }

  remove() {
    this.treeTarget.activeNodes.forEach((node) => {
      this.treeTarget.deleteItem(node);
    });
    this.treeTarget.activeNodes = [];
  }

}
