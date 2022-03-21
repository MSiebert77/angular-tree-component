import { UUID } from "angular2-uuid";
import { BehaviorSubject } from "rxjs";
import { TodoItemNode } from "./datamodel/dataModel";

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
 export class ChecklistDatabase {
   dataChange = new BehaviorSubject<TodoItemNode[]>([]);
   dataKey: number;

   get data(): TodoItemNode[] {
     return this.dataChange.value;
   }
 
   constructor(dataKey: number) {
    this.dataKey = dataKey;
    this.initialize();
   }
 
   public nodes: TodoItemNode[] = []; 
   count: number = 0;
 
   generateNodes2(nodes: any[], base: string, item: string, firstLevelCount: number): any[] {
    nodes = [];
    for (let i = 0; i < firstLevelCount; i++) {
      let child: TodoItemNode = new TodoItemNode();
      child.item = `${item} ${i}`; 
      child.id = UUID.UUID(); 
      child.parentId = undefined; 
      child.isCostCenter = true;
      child.children = []; 
      nodes.push(child);
    }
    return nodes;
   }

    // Dummy-Daten erzeugen
   generateNodes(nodes: any[], base: string, item: string, firstLevelCount: number, secondLevelCount: number, thirdLevelCount: number, fourthLevelCount: number, fifthsLevelCount: number): any[] {
     nodes = [];
     let child: TodoItemNode = new TodoItemNode();
     child.item = base;
     child.id = base; 
     child.parentId = undefined; 
     child.children = []; 
     nodes.push(child);
    
     for (let i = 0; i < firstLevelCount; i++) {
       let child: TodoItemNode = new TodoItemNode();
       child.item = `${item} ${i}`; 
       child.id = UUID.UUID(); 
       child.parentId = nodes[0].id; 
       child.isCostCenter = false;
       child.children = []; 
       nodes[0].children.push(child);
     }
     nodes[0].children.forEach((child) => {
      child.children = this.generateSubChilds(child, secondLevelCount, false);
      child.children.forEach((child) => {
        child.children = this.generateSubChilds(child, thirdLevelCount, false);
        child.children.forEach((child) => {
          child.children = this.generateSubChilds(child, fourthLevelCount, false);
          child.children.forEach((child) => {
            child.children = this.generateSubChilds(child, fifthsLevelCount, true);
          });
        });
      });
     });
     return nodes;
   }
 
   generateSubChilds(child: TodoItemNode, count: number, isCostCenter: boolean) {
    let children: TodoItemNode[] = [];
    for (let i = 0; i < count; i++) {
      let newchild: TodoItemNode = new TodoItemNode();
      newchild.item = `${child.item} ${i}`; 
      newchild.id = UUID.UUID(); 
      newchild.parentId = child.id; 
      newchild.isCostCenter = isCostCenter;
      newchild.children = []; 
      children.push(newchild);
     }
     return children;
   }

   initialize() {
     // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
     //     file node as children.
     let firstLevel: number = 2;
     let secondLevel: number = 10;
     let thirdLevel: number = 5;
     let fourthLevel: number = 5;
     let fifthsLevel: number = 5;
 
     let secondTree: number = 10;

     let data;
     if (this.dataKey == 1) {
       data = this.generateNodes(
        this.nodes,
        'Unternehmen',
        'Node',
        firstLevel,
        secondLevel,
        thirdLevel,
        fourthLevel,
        fifthsLevel,
      );
     } else {
      data = this.generateNodes2(
        this.nodes,
        '',
        'Node',
        secondTree
      );
     }
     // Notify the change.
     this.dataChange.next(data);
   }
 
   /** Add an item to to-do list */
   insertItem(parent: TodoItemNode, newNode: TodoItemNode): TodoItemNode {
     if (parent.children == undefined) {
       parent.children = [];
     }
     const newItem: TodoItemNode = new TodoItemNode();
     newItem.id = newNode.id;
     newItem.parentId = parent.id;
     newItem.item = newNode.item;
     newItem.isCostCenter = newNode.isCostCenter;
     newItem.children = newNode.children;
     parent.children.push(newItem);
     return newItem;
   }
 
   insertItemAbove(node: TodoItemNode, newNode: TodoItemNode): TodoItemNode {
     const parentNode: TodoItemNode = this.getParentFromNodes(node);
     const newItem : TodoItemNode = new TodoItemNode();
     newItem.id = newNode.id;
     newItem.parentId = parentNode.id;
     newItem.item = newNode.item;
     newItem.isCostCenter = newNode.isCostCenter;
     newItem.children = newNode.children;
     if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
     } else {
       this.data.splice(this.data.indexOf(node), 0, newItem);
     }
     return newItem;
   }
 
   /*insertItemBelow(node: TodoItemNode, newNode: TodoItemNode): TodoItemNode {
     const parentNode = this.getParentFromNodes(node);
     const newItem = new TodoItemNode();
     newItem.id = newNode.id;
     newItem.parentId = newNode.parentId;
     newItem.item = newNode.item;
     newItem.dropNotAllowed = newNode.dropNotAllowed;
     if (parentNode != null) {
       parentNode.children.splice(
         parentNode.children.indexOf(node) + 1,
         0,
         newItem
       );
     } else {
       this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
     }
     // this.dataChange.next(this.data);
     return newItem;
   }*/
 
   getParentFromNodes(node: TodoItemNode): TodoItemNode {
     for (let i = 0; i < this.data.length; ++i) {
       const currentRoot = this.data[i];
       const parent = this.getParent(currentRoot, node);
       if (parent != null) {
         return parent;
       }
     }
     return null;
   }
 
   getParent(currentRoot: TodoItemNode, node: TodoItemNode): TodoItemNode {
     if (currentRoot.children && currentRoot.children.length > 0) {
       for (let i = 0; i < currentRoot.children.length; ++i) {
         const child = currentRoot.children[i];
         if (child === node) {
           return currentRoot;
         } else if (child.children && child.children.length > 0) {
           const parent = this.getParent(child, node);
           if (parent != null) {
             return parent;
           }
         }
       }
     }
     return null;
   }
 
   /*updateItem(node: TodoItemNode, name: string) {
     node.item = name;
     this.dataChange.next(this.data);
   }*/
 
   deleteItem(node: TodoItemNode) {
     this.deleteNode(this.data, node);
     this.dataChange.next(this.data);
   }
 
   copyPasteItem(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItem(to, from);
     if (from.children) {
       from.children.forEach((child) => {
         this.copyPasteItem(child, newItem);
       });
     }
     return newItem;
   }

  findNode(root: TodoItemNode, id: string): TodoItemNode {
      let temp: TodoItemNode;
      return root.id === id
          ? root
          : (root.children || []).some(o => temp = this.findNode(o, id)) && temp;
   }
 
   copyPasteItemAbove(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
     const newItem = this.insertItemAbove(to, from);
     if (from.children) {
       from.children.forEach((child) => {
         this.copyPasteItem(child, newItem);
       });
     }
     return newItem;
   }
  
   deleteNode(nodes: TodoItemNode[], nodeToDelete: TodoItemNode) {
    const index: number = nodes.indexOf(nodeToDelete, 0);
     if (index > -1) {
       nodes.splice(index, 1);
     } else {
       nodes.forEach((node) => {
         if (node.children && node.children.length > 0) {
           this.deleteNode(node.children, nodeToDelete);
         }
       });
     }
   }
 }
 