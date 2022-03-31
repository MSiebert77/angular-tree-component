import { Injectable } from "@angular/core";
import { FlateTreeNode } from "./material-tree/datamodel/dataModel";

Injectable({
    providedIn: "root",
})
export class AppsettingsService {

    dragNode: FlateTreeNode;
}