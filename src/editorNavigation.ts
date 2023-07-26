import * as vscode from 'vscode';

export class EditorNavigation {

    public static previousChange() {
        vscode.commands.executeCommand("workbench.action.editor.previousChange");
    }

    public static nextChange() {
        vscode.commands.executeCommand("workbench.action.editor.nextChange");
    }

    public static previousProblem() {
        vscode.commands.executeCommand("editor.action.marker.prev");
    }

    public static nextProblem() {
        vscode.commands.executeCommand("editor.action.marker.next");
    }

}
