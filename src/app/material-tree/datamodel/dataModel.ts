/**
 * Node for to-do item
 */
 
export class TodoItemNode {
    children: TodoItemNode[];
    item: string;
    id: string;
    parentId: string;
    isFolder: boolean;
    order: number;
  }

/** Flat to-do item node with expandable and level information */

export class TodoItemFlatNode {
  item: string;
  level: number;
  expandable: boolean;
  id: string;
  parentId: string;
  isFolder: boolean;
  order: number;
}