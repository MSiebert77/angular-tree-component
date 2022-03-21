import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { UUID } from 'angular2-uuid';
import { AppsettingsService } from '../appsettingsService';
import { ChecklistDatabase } from './checkListDatabase';
import { TodoItemFlatNode, TodoItemNode } from './datamodel/dataModel';


@Component({
  selector: 'app-material-tree',
  templateUrl: './material-tree.component.html',
  styleUrls: ['./material-tree.component.scss']
})
export class MaterialTreeComponent implements OnInit{
  @Input()generateNewIdOnDrag: boolean = false;
  @Input()id: string;
  @Input()connectedTo: string;
  @Output()dragStarted : EventEmitter<TodoItemNode> = new EventEmitter<TodoItemNode>();
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap: Map<TodoItemFlatNode, TodoItemNode> = new Map<TodoItemFlatNode, TodoItemNode>();
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap: Map<TodoItemNode, TodoItemFlatNode> = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';
  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(
    true /* single */
  );

  /* Drag and drop */
  dragNode: TodoItemFlatNode;
  @Input('dataKey') dataKey: number;
  dragNodeExpandOverWaitTimeMs = 500;
  dragNodeExpandOverNode: any;
  dragNodeExpandOverTime: number;
  dragNodeExpandOverArea: number;
  countGetStyle: number = 0;
  private database: ChecklistDatabase;
  private appsettingsService: AppsettingsService;

  constructor(appsettingsService: AppsettingsService) {
    this.appsettingsService = appsettingsService; 
  }

  ngOnInit(): void {
    this.database = new ChecklistDatabase(this.dataKey);
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    this.database.dataChange.subscribe((data) => {
      this.flatNodeMap.clear();
      this.dataSource.data = [];
      this.dataSource.data = data;
    });
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) =>
    _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode: TodoItemFlatNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.id = node.id;
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.parentId = node.parentId;
    flatNode.isCostCenter = node.isCostCenter;
    flatNode.expandable = !node.isCostCenter;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected */
  /*descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every((child) =>
      this.checklistSelection.isSelected(child)
    );
  }*/

  /** Whether part of the descendants are selected */
/*  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }*/

  isDescendant(dragNode: TodoItemFlatNode, node: TodoItemFlatNode): boolean {
    let retValue: boolean = false;
    if (dragNode.id == node.id) {
      return true;
    }
    const descendants = this.treeControl.getDescendants(dragNode);
    for(let descendant of descendants) {
      if (descendant.isCostCenter) {
        retValue = true;
        console.log(descendant);
        break;
      }
      if (descendant.parentId === node.id) {
        retValue = true;
        break;
      };
    }
    return retValue;
  }


  /** Toggle the to-do item selection. Select/deselect all the descendants node */
/*  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }*/
  

/*  isDescendant(child: TodoItemFlatNode, parent: TodoItemFlatNode): boolean {
    //console.log(child.parentId + " - " + parent.id)
    while (parent != null && parent.id !== "Unternehmen") {
      if (parent.id  === child.parentId) {
        return true;
      }
      parent = null;
      for (let [key, value] of this.flatNodeMap) {
        if (key.id == parent.id) {
          console.log(key);
        }
      }
    }
    return false;
  }*/

  /** Select the category so we can insert the new item. */
  addNewItem() {
    if (!this.activeNode) {
      return;
    }
    const parentNode = this.flatNodeMap.get(this.activeNode);
    const newItem = new TodoItemNode();
    newItem.id = UUID.UUID();
    newItem.parentId = this.activeNode.id;
    newItem.isCostCenter = false;
    newItem.item = 'Neuer Eintrag';
    newItem.children = [];
    this.database.insertItem(parentNode, newItem);
    this.database.dataChange.next(this.database.data);
    this.treeControl.expand(this.activeNode);
  }

  /** Save the node to database */
  /*saveNode(node: TodoItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updateItem(nestedNode, itemValue);
  }*/

  handleDragStart(event, node) {
    if (node.id === 'Unternehmen') {
      this.handleDragEnd(event);
      return;
    }
    if (this.generateNewIdOnDrag) {
      node.id = UUID.UUID();
    }
    this.appsettingsService.dragNode = node;
    this.activeNode = undefined;
  }

  handleDragOver(event, node) {
    this.dragNode = this.appsettingsService.dragNode;
    event.preventDefault();
    if (node.id == 'Unternehmen') {
      this.dragNodeExpandOverArea = 0;
    } else {
      // Handle drag area
      const percentageY = event.offsetY / event.target.clientHeight;
      if (percentageY == NaN || percentageY == Infinity || percentageY >= 0.05) {
        this.dragNodeExpandOverArea = 0;
      } else {
        this.dragNodeExpandOverArea = 1;
      }
    }

    // Handle node expand
    if (
      this.dragNodeExpandOverArea == 0 &&
      this.dragNodeExpandOverNode &&
      node === this.dragNodeExpandOverNode
    ) {
      if (
        Date.now() - this.dragNodeExpandOverTime >
        this.dragNodeExpandOverWaitTimeMs
      ) {
        if (!this.treeControl.isExpanded(node)) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }
  }


  handleDrop(event, node) {
    let dragNode: TodoItemFlatNode = this.appsettingsService.dragNode;
    if (node.id == dragNode.id || this.dropAllowed == false || this.orderAllowed == false
      || (node.isCostCenter == true && this.dragNodeExpandOverArea == 0)
      || node.parentId == dragNode.id || this.isDescendant(dragNode, node)) {
      this.handleDragEnd(event);
      return;      
    }
      
/*    if (node.parentId === dragNode.id || (node.expandable && !this.canDrop(node) && node.level > dragNode.level)) {
      this.handleDragEnd(event);
      return;
    }
*/
    let insertNode: TodoItemNode = new TodoItemNode();
    insertNode.id = dragNode.id;
    insertNode.item = dragNode.item;
    insertNode.isCostCenter = dragNode.isCostCenter;
    insertNode.parentId = node.id;

    let index: TodoItemNode = this.database.findNode(this.database.data[0], insertNode.id);
    if (index != undefined) {
      insertNode.children = index.children;
    }

    this.flatNodeMap.forEach((value,key) => {
      if (value.id == dragNode.id) {
        this.database.deleteItem(value);
      }
    });
    
    let newItem: TodoItemNode;
    if (node !== this.dragNode) {
        if (this.dragNodeExpandOverArea === 1) {
          newItem = this.database.insertItemAbove(
            this.flatNodeMap.get(node),
            insertNode,
          );
      } else {
        newItem = this.database.insertItem(
          this.flatNodeMap.get(node),
          insertNode
        );
      }
    }
    this.database.dataChange.next(this.database.data);
    this.handleDragEnd(event);
  }

  
  handleDragEnd(event) {
    this.dragNode = null;
    this.activeNode = undefined;
    this.appsettingsService.dragNode = undefined;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
    this.dragNodeExpandOverArea = NaN;
    event.preventDefault();
  }

  canDrop(node: TodoItemFlatNode): boolean {
    let dragNode: TodoItemFlatNode = this.appsettingsService.dragNode;
    let level: number = this.dragNode.level;
    while(node != undefined && node.item && node.parentId != 'Unternehmen' && node.parentId != undefined && node.level != level) {
      for (let [key, value] of this.flatNodeMap) {
        if (key.id == node.parentId) {
          node = key;
        }
      }
    }
    while(dragNode != undefined && dragNode.item && dragNode.parentId != 'Unternehmen' && dragNode.parentId != undefined && dragNode.level != level) {
      for (let [key, value] of this.flatNodeMap) {
        if (key.id == dragNode.parentId) {
          dragNode = key;
        }
      }
    }
    if (!dragNode || !node || dragNode.id != node.id ) {
      return true;
    } else if (dragNode.id == node.id) {
      return false;
    }
  }

  dropAllowed: boolean = true;
  @Input() orderAllowed: boolean = true;
  getStyle(node: TodoItemFlatNode) {
    let style: string = node.expandable ? 'structure-node ' : 'leaf-node ';
    this.dragNode = this.appsettingsService.dragNode;

    if (!this.orderAllowed && this.dragNodeExpandOverNode === node && this.dragNode) {
      style +=  'drop-not-allowed';
      return style;
    }
    this.dropAllowed = true;
    if (this.dragNode === node) {
      style += 'drag-start';
    } 
    else if (this.dragNodeExpandOverNode === node && this.dragNode) {
      if (node.parentId === this.dragNode.id || this.isDescendant(this.dragNode, node)) { 
        //) (!this.canDrop(node) && node.level > this.dragNode.level)) {
        this.dropAllowed = false;
        style += 'drop-not-allowed';
        return style;
      }
      switch (this.dragNodeExpandOverArea) {
        case 1:
          if (node.id === 'Unternehmen') {
            style+= 'drop-center';
          }
          else {
            style+= 'drop-above';
          }
          break;
        case -1:
          style += 'drop-below';
          break;
        default:
          /*if (node.parentId === this.dragNode.id || (node.expandable && !this.canDrop(node) && node.level > this.dragNode.level)) {
            this.dropAllowed = node.isCostCenter == false;
            style += 'drop-not-allowed';
          }
          else 
          */if (node.isCostCenter === true) {
            this.dropAllowed = false;
            style += 'drop-not-allowed';
          } 
          else 
          {
            style += 'drop-center';
          }
      }
    } else {
      style = node.expandable ? 'structure-node' : 'leaf-node';
    }
    return style;
  }

  edit() {
  }

  deleteItem(node: TodoItemFlatNode) {
    this.database.deleteItem(this.flatNodeMap.get(node));
  }

  // count the clicks
  /* private clickTimeout = null;
  public nodeEditMode: boolean = false;
  public getItem(item): void {
    if (this.clickTimeout) {
      this.setClickTimeout(() => {
        this.nodeEditMode = true;
      });
    } else {
      // if timeout doesn't exist, we know it's first click
      // treat as single click until further notice
      this.setClickTimeout((item) => this.handleSingleClick(item));
    }
  }
  // sets the click timeout and takes a callback
  // for what operations you want to complete when
  // the click timeout completes
  public setClickTimeout(callback) {
    // clear any existing timeout
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickTimeout = null;
      callback();
    }, 200);
  }
  public handleSingleClick(item) {
    //    this.nodeEditMode = false;
    //The actual action that should be performed on click
  }

  public blurEvent() {
    this.nodeEditMode = false;
  }*/
  activeNode: TodoItemFlatNode;
}
 