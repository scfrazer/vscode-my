import * as vscode from 'vscode';

export class Util {

    public static updateSelections(positionFunction: (document: vscode.TextDocument, startPosition: vscode.Position) => vscode.Position | undefined, select: boolean) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            const newPosition = positionFunction(document, selection.active);
            if (newPosition === undefined) {
                return selection;
            }
            return (new vscode.Selection((select || !selection.isEmpty) ? selection.anchor : newPosition, newPosition));
        });
        vscode.commands.executeCommand<void>("revealLine", { lineNumber: editor.selection.active.line });
    }

    public static deleteToPosition(positionFunction: (document: vscode.TextDocument, startPosition: vscode.Position) => vscode.Position | undefined) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {
                const newPosition = positionFunction(document, selection.active);
                if (newPosition === undefined) {
                    return;
                }
                const range = new vscode.Range(selection.anchor, newPosition);
                editBuilder.delete(range);
            });
        });
    }

    public static escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'); // $& means the whole matched string
    }
}
