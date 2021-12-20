import * as vscode from 'vscode';

export class Misc {


    public addCursorsToLineStarts() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let firstLine = editor.selection.start.line;
        let lastLine = editor.selection.end.line;
        let selections: Array<vscode.Selection> = [];
        for (let lineNum = firstLine; lineNum < lastLine; lineNum += 1) {
            let position = new vscode.Position(lineNum, 0);
            selections.push(new vscode.Selection(position, position));
        }
        editor.selections = selections;
    }
}
