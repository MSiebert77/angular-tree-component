import { Injectable } from "@angular/core";
import { TodoItemFlatNode } from "./material-tree/datamodel/dataModel";

Injectable({
    providedIn: "root",
})
export class AppsettingsService {

    dragNode: TodoItemFlatNode;
}