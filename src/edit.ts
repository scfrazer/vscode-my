import * as vscode from "vscode";

export class Edit {
    private static _prevFilePath: string;
    private static _prevStartPosition: vscode.Position | undefined;

    public static async copy() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        await vscode.commands.executeCommand<void>("editor.action.clipboardCopyAction");

        // TODO: Make this configurable

        const copyDecorationType = vscode.window.createTextEditorDecorationType({
            color: "white",
            backgroundColor: "#005f87",
            borderRadius: "2px",
        });

        let ranges: vscode.Range[] = [];
        if (editor.selection.isEmpty) {
            ranges.push(editor.document.lineAt(editor.selection.active).range);
        } else {
            editor.selections.map((selection) => {
                ranges.push(new vscode.Range(selection.start, selection.end));
            });
        }
        editor.setDecorations(copyDecorationType, ranges);

        // TODO: Make this configurable

        setTimeout(() => {
            copyDecorationType.dispose();
        }, 400);
    }

    public static async paste() {
        const editor = vscode.window.activeTextEditor;
        const onlyOneSelection = editor && editor.selections.length === 1;

        if (onlyOneSelection) {
            if (editor.selection.isEmpty) {
                const clipboardText = await vscode.env.clipboard.readText();
                if (clipboardText.search(/\n/) !== -1) {
                    await vscode.commands.executeCommand<void>("cursorMove", { to: "wrappedLineStart" });
                }
            }
            Edit._prevFilePath = editor.document.uri.fsPath;
            Edit._prevStartPosition = editor.selection.start;
        }

        await vscode.commands.executeCommand<void>("editor.action.clipboardPasteAction");
    }

    public static async previousPaste() {
        const editor = vscode.window.activeTextEditor;
        if (editor && Edit._prevFilePath === editor.document.uri.fsPath && Edit._prevStartPosition) {
            editor.selection = new vscode.Selection(Edit._prevStartPosition, editor.selection.start);
        }
    }

    public static async pasteSelectedAtLastEditLocation() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        await vscode.commands.executeCommand<void>("editor.action.clipboardCopyAction");
        await vscode.commands.executeCommand<void>("workbench.action.navigateToLastEditLocation");
        await vscode.commands.executeCommand<void>("editor.action.clipboardPasteAction");
    }

    public static async swapSelectionAndClipboard() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        if (editor.selections.length !== 1 || editor.selection.isEmpty) {
            return;
        }
        const currentSelectionText = editor.document.getText(editor.selection);
        await vscode.commands.executeCommand<void>("editor.action.clipboardPasteAction");
        await vscode.env.clipboard.writeText(currentSelectionText);
    }
}
