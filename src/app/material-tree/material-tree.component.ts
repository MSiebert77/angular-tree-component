import * as _ from "lodash";
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { UUID } from 'angular2-uuid';
import { ChecklistDatabase } from './checkListDatabase';
import { TodoItemFlatNode, TodoItemNode } from './datamodel/dataModel';

@Component({
  selector: 'app-material-tree',
  templateUrl: './material-tree.component.html',
  styleUrls: ['./material-tree.component.scss']
})
export class MaterialTreeComponent implements OnInit{
  @Input('allowMultiselect') allowMultiselect: boolean = true;
  @Input('dropAllowed') dropAllowed: boolean = true;
  @Input('generateNewIdOnDrag') generateNewIdOnDrag: boolean = false;
  @Input('id') id: string;
  @Input('dataKey') dataKey: number;

  private dragGhostId: string = "drag-ghost";
  private innerHtmlDropNotAllowed: string = "<i class='fa fa-ban' style='font-size:14px;color:red';></i>&nbsp;&nbsp;&nbsp;";
  private innerHtmlDropAllowed: string = "<i class='fa fa-plus' style='font-size:14px;color:green';></i>&nbsp;&nbsp;&nbsp;";
  private innerHtmlDropInsert: string = "<i class='fa fa-bars' style='font-size:14px;color:blue';></i>&nbsp;&nbsp;&nbsp;";
  private dragShiftX: number = 15;
  private dragShiftY: number = 15;

  // Attribute Keys
  private attributeKeySource: string = "source";
  private attributeKeyData: string = "data";
  private attributeKeyDataLength: string = "datalength";
  private attributeKeyText: string = "text";
  private attributeKeyNodeId: string = "nodeid";
  private attributeKeyDropAllowed: string = "dropAllowed";
  private attributeKeyDragNodeExpandOverArea: string = "dragNodeExpandOverArea";

  // Class für Droppable
  private classNameDroppable: string = ".droppable"

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap: Map<TodoItemFlatNode, TodoItemNode> = new Map<TodoItemFlatNode, TodoItemNode>();
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  private nestedNodeMap: Map<TodoItemNode, TodoItemFlatNode> = new Map<TodoItemNode, TodoItemFlatNode>();

  /** The new item's name */
  newItemName: string = '';
  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  private database: ChecklistDatabase;
  public rootSelected: boolean = false;

  constructor() {
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
    this.treeControl.expand(this.treeControl.dataNodes[0]);
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
    const flatNode: TodoItemFlatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.id = node.id;
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.order = node.order;
    flatNode.parentId = node.parentId;
    flatNode.isFolder = node.isFolder;
    flatNode.expandable = !node.isFolder;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  addNewItem() {
    if (!this.activeNode) {
      return;
    }
    const parentNode: TodoItemNode = this.flatNodeMap.get(this.activeNode);
    const newItem: TodoItemNode = new TodoItemNode();
    newItem.id = UUID.UUID();
    newItem.parentId = this.activeNode.id;
    newItem.isFolder = false;
    newItem.item = 'Neuer Eintrag';
    newItem.children = [];
    this.database.insertItem(parentNode, newItem);
    this.database.dataChange.next(this.database.data);
    this.treeControl.expand(this.activeNode);
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
  activeNodes: TodoItemFlatNode[] = [];
  pressTimer: number;
  currentDroppable: Element = null;

  mouseDown(event, node) {
    event.preventDefault();
    this.pressTimer = window.setTimeout(() => {
      let activeNodesSelected: boolean = this.activeNodes.indexOf(node) != -1;
      var elem = document.createElement("div");
      elem.id = this.dragGhostId;
      elem.style.border = "none";
      elem.style.backgroundColor = "lightgray";
      elem.style.color = "black";
      elem.style.position = "absolute";
      elem.style.top = "-1000px";
      elem.style.height = "25px";
      elem.style.minWidth = "100px";
      elem.style.paddingTop = "10px";
      elem.style.paddingLeft = "20px";
      elem.style.paddingRight = "20px";
      elem.style.paddingBottom = "10px";
      if (activeNodesSelected == true) {
        if (this.generateNewIdOnDrag == true) {
          this.activeNodes.forEach((node) => {
            node.id = UUID.UUID();
          });
        }
        this.activeNodes.sort((x, y) => {
          if (x.item > y.item) {
            return 1;
          }
          if (x.item < y.item) {
            return -1;
          }
          return 0;
        });
        elem.setAttribute(this.attributeKeyData, JSON.stringify(this.activeNodes));
        elem.setAttribute(this.attributeKeyDataLength, "" + this.activeNodes.length);
        elem.setAttribute(this.attributeKeyText, this.activeNodes[0].item);
      } else {
        if (this.generateNewIdOnDrag == true) {
          node.id = UUID.UUID();
        }
        elem.setAttribute(this.attributeKeyData, JSON.stringify([node]));
        elem.setAttribute(this.attributeKeyText, node.item);
      }
      elem.setAttribute(this.attributeKeySource, this.id);
      elem.setAttribute(this.attributeKeyNodeId, node.id);
      elem.setAttribute(this.attributeKeyDropAllowed, "0");
      elem.innerHTML =  this.innerHtmlDropNotAllowed + node.item;
      if (this.activeNodes.length > 1) {
        elem.innerHTML +=  " <sup>(" + this.activeNodes.length + ")</sup>";
      }
      document.onmouseup = ((event)  => {
        this.externalMouseUp();
        this.removeEventListeners(); 
      })
      document.onmousemove = ((event)  => {
        this.externalMouseOver(event); 
      });
      document.body.appendChild(elem);
      this.moveAt(event.pageX, event.pageY);
    }, 250);

    this.moveAt(event.pageX, event.pageY);

    event.srcElement.ondragstart = function() {
      return false;
    };
  }   

  createNewIdsAfterCopy(nodes: TodoItemNode[]) {
    if (nodes?.length > 0) {
      nodes.forEach((node) => {
        node.id = UUID.UUID();
        if(node.children?.length > 0) {
          this.createNewIdsAfterCopy(node.children);
        }
      });
    }
  }

  moveAt(pageX, pageY) {
    let element = document.getElementById(this.dragGhostId);
    if (!element) {
      return;
    }
    element.style.left = pageX + this.dragShiftX + 'px';
    element.style.top = pageY + this.dragShiftY + 'px';
  }

  removeEventListeners() {
    document.onmousemove = ((event)  => {
      undefined; 
    });
    document.onmouseup = ((event)  => {
      undefined; 
    });
  }

  externalMouseOver(event) {
    let element = document.getElementById(this.dragGhostId);
    if (!element) {
      return;
    }
    this.moveAt(event.clientX, event.clientY);
  }
  
  externalMouseUp() {
    this.cleanUp();
  }

  cleanUp() {
    let ghost: HTMLElement = document.getElementById(this.dragGhostId);
    if (!ghost) {
      return;
    }
    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
   // this.dragNodeExpandOverArea = "-1";
    this.currentDroppable = undefined;
  }

  onMouseMove(event, node) {
    let element = document.getElementById(this.dragGhostId);
    if (!element) {
      return;
    }
    this.moveAt(event.clientX, event.clientY);

    if (node == undefined) {
      return;
    }

    let source = element.getAttribute(this.attributeKeySource);
    let dataLength = element.getAttribute(this.attributeKeyDataLength);
    let text = element.getAttribute(this.attributeKeyText);
    let nodeid = element.getAttribute(this.attributeKeyNodeId);
    let nodesString: string = text + (dataLength != null && dataLength != "1" ? ' <sup>(' + dataLength + ')</sup>' : '');
   
    if (source == this.id && !this.dropAllowed) {
      element.innerHTML = this.innerHtmlDropNotAllowed + nodesString 
      element.setAttribute(this.attributeKeyDropAllowed, "0");
      this.moveAt(event.clientX, event.clientY);
      return;
    }
    
    if (source == this.id) {
      let index = this.treeControl.dataNodes.findIndex(x => x.id == nodeid);
      if (index != -1) {
        let descendants: TodoItemFlatNode[] = this.treeControl.getDescendants(this.treeControl.dataNodes[index]);
        if (descendants.findIndex(x => x.id == node.id) != -1) {
          element.innerHTML = this.innerHtmlDropNotAllowed + nodesString
          element.setAttribute(this.attributeKeyDropAllowed, "0");
          return;
        }
      }
    }
  //  element.hidden = true;
    let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
    if (!elemBelow) {
      return;
    }   
    let dragNodeExpandOverArea;
    let middle = elemBelow.getBoundingClientRect().y + (elemBelow.getBoundingClientRect().height / 2);
    // Dropposition oberhalb
    if (middle - event.y > 10) {
      dragNodeExpandOverArea = "1";
    }
    // Dropposition unterhalb
    else if (middle - event.y < -5 ) {
      dragNodeExpandOverArea = "2";
    }
    // Dropposition darauf
    else {
      dragNodeExpandOverArea = "0";
    }
    element.setAttribute(this.attributeKeyDragNodeExpandOverArea, dragNodeExpandOverArea);
  //  element.hidden = false;

    // Kein Droppable verfügbar, Node leer oder gleicher Node, auf den gedroppt werden soll
    let droppableBelow = elemBelow.closest(this.classNameDroppable);
    if (!node ||!droppableBelow || droppableBelow.id == element.id || node.id == nodeid || 
      (dragNodeExpandOverArea == 1 && droppableBelow.getAttribute("isroot") == "true")) {
      element.innerHTML = this.innerHtmlDropNotAllowed + nodesString
      element.setAttribute(this.attributeKeyDropAllowed, "0");
      return;
    }

/*    if (node.item === "Unternehmen") {
      element.innerHTML = "<i class='fa fa-ban' style='font-size:14px;color:red';></i>&nbsp;&nbsp;&nbsp;" + nodesString;
      element.setAttribute('dropAllowed', "0");
    } else */
    if (elemBelow.nodeName === "MAT-TREE-NODE" || elemBelow.nodeName === "BUTTON") {
        element.innerHTML = this.innerHtmlDropInsert + nodesString;
        element.setAttribute(this.attributeKeyDropAllowed, "1");
        this.currentDroppable = droppableBelow;
    } else if (elemBelow.nodeName === "MAT-ICON") {
      element.innerHTML = this.innerHtmlDropAllowed + nodesString;
      element.setAttribute(this.attributeKeyDropAllowed, "1");
      this.currentDroppable = droppableBelow;
    } else {
      if (this.currentDroppable) { // null when we were not over a droppable before this event
        element.innerHTML = this.innerHtmlDropNotAllowed + nodesString;
        element.setAttribute(this.attributeKeyDropAllowed, "0");
      }
      this.currentDroppable = droppableBelow;
      if (this.currentDroppable) { // null if we're not coming over a droppable now
        // (maybe just left the droppable)
        if (this.currentDroppable.id !== element.id && this.currentDroppable.getAttribute('isfolder') === "false" ) {
          element.innerHTML = this.innerHtmlDropAllowed + nodesString;
          element.setAttribute(this.attributeKeyDropAllowed, "1");
        } else {
          element.innerHTML = this.innerHtmlDropNotAllowed + nodesString;
          element.setAttribute(this.attributeKeyDropAllowed, "0");
        }
      }
    }
  }

  mouseUp(event, node) {
    clearTimeout(this.pressTimer);
    let ghost: HTMLElement = document.getElementById(this.dragGhostId);
    if (!ghost) {
      return;
    }
    // Die einzufügenden Node-Daten aus dem Drag-Ghost holen
    let nodeDataEntries = JSON.parse(ghost.getAttribute(this.attributeKeyData));
    let source = ghost.getAttribute(this.attributeKeySource);
    let dropAllowed = ghost.getAttribute(this.attributeKeyDropAllowed);
    let dragNodeExpandOverArea = ghost.getAttribute(this.attributeKeyDragNodeExpandOverArea);
    if (ghost && ghost.parentNode) {
      if (dropAllowed == "0") {
        this.cleanUp();
        return;
      }
      let newItem: TodoItemNode;

      for(let i = nodeDataEntries.length -1; i >= 0; i-- ) {
        let nodeData = nodeDataEntries[i];
        let newNode = new TodoItemNode();
        newNode.item = nodeData.item;
        // KEINE neue ID wenn von gleichem Baum ...
      //  if (source == this.id) {//} && event.ctrlKey == false) {
          newNode.id = nodeData.id;
//        } else {
  //        newNode.id = UUID.UUID();
    //    }
        newNode.isFolder = nodeData.isFolder;
        newNode.parentId = nodeData.id;
        newNode.children = [];

        if (source == this.id) {
          let index: TodoItemNode = this.database.findNode(this.database.data[0], newNode.id);
          if (index != undefined) {
             newNode.children = index.children;
          }

          this.flatNodeMap.forEach((value,key) => {
            if (value.id == newNode.id) {
              this.database.deleteItem(value);
            }
          });
        }

        if (dragNodeExpandOverArea == "0") {
          if (node.parentId == undefined) {
            if (!newItem) {
              newItem = this.database.insertItem(
                this.flatNodeMap.get(node),
                newNode,
              );
            } else {
              newItem = this.database.insertItemBelow(
                newItem,
                newNode,
              );
            }
          } else {
            newItem = this.database.insertItem(
              this.flatNodeMap.get(node),
              newNode,
            );
          }
          if (node.expandable) {
            this.treeControl.expand(node);
          }
        } else if (dragNodeExpandOverArea == "2" ) {
          newItem = this.database.insertItemBelow(
            this.flatNodeMap.get(node),
            newNode
          );
        } else if (dragNodeExpandOverArea == "1" && node.parentId != undefined) {
          newItem = this.database.insertItemAbove(
            this.flatNodeMap.get(node),
            newNode,
          );
        }
      }
      this.cleanUp();
      this.database.dataChange.next(this.database.data);
    }
  }

  // Aktualisiert die selektierten Nodes bei Klick auf einen Node. So können mehrere Nodes per Drag-and-Drop 
  // aus dem Source übertragen werden.
  updateActiveNodes(event, node) {
    this.activeNode = node;
    let index = this.activeNodes.indexOf(node); 
    if (this.allowMultiselect && event.ctrlKey) {
      if (index != -1) {
        this.activeNodes = this.activeNodes.filter(item => item !== node);
      }
      else {
        this.activeNodes.push(node);
      }
    }
    else {
      this.activeNodes.splice(0);
      this.activeNodes.push(node);
    }
    this.rootSelected = this.activeNodes.findIndex(x => x.parentId == undefined) != -1;
  }
}