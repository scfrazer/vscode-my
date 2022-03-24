import * as vscode from 'vscode';

export class LineCount {

    private static _statusBarItem: vscode.StatusBarItem;

    public static subscribeToDocumentChanges(context: vscode.ExtensionContext): void {

        LineCount._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        LineCount._statusBarItem.text = "Line Count: N/A";
        LineCount._statusBarItem.show();

        context.subscriptions.push(LineCount._statusBarItem);

        if (vscode.window.activeTextEditor) {
            LineCount._update(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    LineCount._update(editor.document);
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((editor) => {
                LineCount._update(editor.document);
            })
        );
    }

    private static _update(document: vscode.TextDocument): void {
        const lastLineNum = document.lineCount;
        LineCount._statusBarItem.text = `Line Count: ${lastLineNum}`;
        LineCount._statusBarItem.show();
    }
}
