import * as vscode from 'vscode';

export class Reselect {

    private static _prevFilePath: string;
    private static _prevStartPosition: vscode.Position | undefined;

    public static async paste() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            Reselect._prevFilePath = editor.document.uri.fsPath;
            if (editor.selections.length === 1) {
                Reselect._prevStartPosition = editor.selection.start;
            }
        }
        vscode.commands.executeCommand<void>("editor.action.clipboardPasteAction");
    }

    public static async previousPaste() {
        const editor = vscode.window.activeTextEditor;
        if (editor && Reselect._prevFilePath === editor.document.uri.fsPath && Reselect._prevStartPosition) {
            editor.selection = new vscode.Selection(Reselect._prevStartPosition, editor.selection.active);
        }
    }
}
