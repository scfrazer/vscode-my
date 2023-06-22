import * as vscode from 'vscode';

export class Reselect {

    private static _prevFilePath: string;
    private static _prevStartPosition: vscode.Position | undefined;
    private static _prevEndPosition: vscode.Position | undefined;

    public static async paste() {

        const editor = vscode.window.activeTextEditor;
        const onlyOneSelection = (editor && editor.selections.length === 1);

        if (onlyOneSelection) {
            if (editor.selection.isEmpty) {
                const clipboardText = await vscode.env.clipboard.readText();
                if (clipboardText.search(/\n/) !== -1) {
                    await vscode.commands.executeCommand<void>("cursorMove", { to: "wrappedLineStart" });
                }
            }
            Reselect._prevFilePath = editor.document.uri.fsPath;
            Reselect._prevStartPosition = editor.selection.start;
        }

        await vscode.commands.executeCommand<void>("editor.action.clipboardPasteAction");

        if (onlyOneSelection) {
            await vscode.commands.executeCommand<void>("editor.action.cancelSelectionAnchor");
            Reselect._prevEndPosition = editor.selection.start;
        }
    }

    public static async previousPaste() {
        const editor = vscode.window.activeTextEditor;
        if (editor && Reselect._prevFilePath === editor.document.uri.fsPath && Reselect._prevStartPosition && Reselect._prevEndPosition) {
            editor.selection = new vscode.Selection(Reselect._prevStartPosition, Reselect._prevEndPosition);
        }
    }
}
