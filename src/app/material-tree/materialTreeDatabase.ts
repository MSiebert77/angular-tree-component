import { UUID } from "angular2-uuid";
import { BehaviorSubject } from "rxjs";
import { TreeNode } from "./datamodel/dataModel";

/**
 * MaterialTreeDataBase, it can build a tree structured Json object.
 * Each node in Json object represents a tree-node or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
 export class MaterialTreeDataBase {
   dataChange = new BehaviorSubject<TreeNode[]>([]);
   dataKey: number;
   baseNode: TreeNode;

   get data(): TreeNode[] {
     return this.dataChange.value;
   }
 
   constructor(dataKey: number) {
    this.dataKey = dataKey;
    this.initialize();
   }
 
   public nodes: TreeNode[] = []; 
   count: number = 0;
 
   generateNodes2(nodes: any[], base: string, item: string, firstLevelCount: number): any[] {
    nodes = [];
    for (let i = 0; i < firstLevelCount; i++) {
      let child: TreeNode = new TreeNode();
      child.item = `${item} ${i}`; 
      child.id = UUID.UUID(); 
      child.parentId = undefined; 
      child.isFolder = true;
      child.children = []; 
      nodes.push(child);
    }
    return nodes;
   }

    // Dummy-Daten erzeugen
   generateNodes(nodes: any[], base: string, item: string, firstLevelCount: number, secondLevelCount: number, thirdLevelCount: number, fourthLevelCount: number, fifthsLevelCount: number): any[] {
     let order:number = 0;
     nodes = [];
     let child: TreeNode = new TreeNode();
     child.item = base;
     child.id = base; 
     child.parentId = undefined; 
     child.isFolder = false;
     child.children = []; 
     child.order = order;
     nodes.push(child);
    
     order = 0;
     for (let i = 0; i < firstLevelCount; i++) {
       let child: TreeNode = new TreeNode();
       child.item = `${item} ${i}`; 
       child.id = UUID.UUID(); 
       child.parentId = nodes[0].id; 
       child.isFolder = false;
       child.children = []; 
       child.order = order++;
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
 
   generateSubChilds(child: TreeNode, count: number, isFolder: boolean) {
    let order: number = 0;
    let children: TreeNode[] = [];
    for (let i = 0; i < count; i++) {
      let newchild: TreeNode = new TreeNode();
      newchild.item = `${child.item} ${i}`; 
      newchild.id = UUID.UUID(); 
      newchild.parentId = child.id; 
      newchild.order = order++; 
      newchild.isFolder = isFolder;
      newchild.children = []; 
      children.push(newchild);
     }
     return children;
   }

   initialize() {
     // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
     //     file node as children.
     let firstLevel: number = 5;
     let secondLevel: number = 5;
     let thirdLevel: number = 3;
     let fourthLevel: number = 2;
     let fifthsLevel: number = 3;
 
     let secondTree: number = 10;

     if (this.dataKey == 1) {
       this.nodes = this.generateNodes(
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
      this.nodes = this.generateNodes2(
        this.nodes,
        '',
        'Node',
        secondTree
      );
     }
     // Notify the change.
     this.dataChange.next(this.nodes);
   }
 
   /** Add an item to to-do list */
   insertItem(parent: TreeNode, newNode: TreeNode, addFirst: boolean = false): TreeNode {
    if (parent.children == undefined) {
       parent.children = [];
     }
     const newItem: TreeNode = new TreeNode();
     newItem.id = newNode.id;
     newItem.parentId = parent.id;
     newItem.item = newNode.item;
     newItem.isFolder = newNode.isFolder;
     newItem.children = newNode.children;
     if (addFirst == true) {
      parent.children = [newItem, ... parent.children];
     }
     else {
      parent.children.push(newItem);
     }
     this.updateOrder(parent);
     return newItem;
   }
 
   insertItemAbove(node: TreeNode, newNode: TreeNode): TreeNode {
     const parentNode: TreeNode = this.getParentFromNodes(node);
     const newItem : TreeNode = new TreeNode();
     newItem.id = newNode.id;
     newItem.parentId = parentNode.id;
     newItem.item = newNode.item;
     newItem.isFolder = newNode.isFolder;
     newItem.children = newNode.children;
     if (parentNode != null) {
       parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
     //  console.log("insertItemAbove updateOrder")
       this.updateOrder(parentNode);
     } else {
       this.data.splice(this.data.indexOf(node), 0, newItem);
       console.log("insertItemAbove splice")
      }

     return newItem;
   }
 
   updateOrder(node) {
    let order = 0;
    node.children?.forEach((child) => {
       child.order = order++;
    });
   }

   insertItemBelow(node: TreeNode, newNode: TreeNode): TreeNode {
    let parentNode = this.getParentFromNodes(node);
     if (!parentNode) {
       parentNode = node;
     }
     const newItem = new TreeNode();
     newItem.id = newNode.id;
     newItem.parentId = parentNode.id;
     newItem.item = newNode.item;
     newItem.isFolder = newNode.isFolder;
     newItem.children = newNode.children;
     if (parentNode != null) {
       parentNode.children.splice(
         parentNode.children.indexOf(node) + 1,
         0,
         newItem
       );
      // console.log("insertItemBelow updateOrder")
       this.updateOrder(parentNode);
     } else {
       this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
       console.log("insertItemBelow splice")
     }
     // this.dataChange.next(this.data);
     return newItem;
   }
 
   getParentFromNodes(node: TreeNode): TreeNode {
     for (let i = 0; i < this.data.length; ++i) {
       const currentRoot = this.data[i];
       const parent = this.getParent(currentRoot, node);
       if (parent != null) {
         return parent;
       }
     }
     return null;
   }
 
   getParent(currentRoot: TreeNode, node: TreeNode): TreeNode {
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
 
   deleteItem(node: TreeNode) {
     this.deleteNode(this.data, node);
     this.dataChange.next(this.data);
   }
 
   copyPasteItem(from: TreeNode, to: TreeNode): TreeNode {
    const newItem = this.insertItem(to, from);
     if (from.children) {
       from.children.forEach((child) => {
         this.copyPasteItem(child, newItem);
       });
     }
     return newItem;
   }

  public findNode(root: TreeNode, id: string): TreeNode {
      let temp: TreeNode;
      return root.id === id
          ? root
          : (root.children || []).some(o => temp = this.findNode(o, id)) && temp;
  }
 
  copyPasteItemAbove(from: TreeNode, to: TreeNode): TreeNode {
     const newItem = this.insertItemAbove(to, from);
     if (from.children) {
       from.children.forEach((child) => {
         this.copyPasteItem(child, newItem);
       });
     }
     return newItem;
   }
  
   deleteNode(nodes: TreeNode[], nodeToDelete: TreeNode) {
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
 