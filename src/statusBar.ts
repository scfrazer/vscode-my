import * as vscode from "vscode";

export class StatusBar {
    private static _statusBarMatchesItem: vscode.StatusBarItem;
    private static _statusBarLineCountItem: vscode.StatusBarItem;
    private static _statusBarCopilotItem: vscode.StatusBarItem;

    public static subscribeToChanges(context: vscode.ExtensionContext): void {
        StatusBar._statusBarMatchesItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 103);
        StatusBar._statusBarMatchesItem.text = "Matches: N/A";
        StatusBar._statusBarMatchesItem.show();

        StatusBar._statusBarLineCountItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
        StatusBar._statusBarLineCountItem.text = "Line Count: N/A";
        StatusBar._statusBarLineCountItem.show();

        StatusBar._statusBarCopilotItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        StatusBar._statusBarCopilotItem.command = "github.copilot.completions.toggle";
        StatusBar._updateCopilotStatusBarItem();
        StatusBar._statusBarCopilotItem.show();

        context.subscriptions.push(StatusBar._statusBarMatchesItem);
        context.subscriptions.push(StatusBar._statusBarLineCountItem);

        if (vscode.window.activeTextEditor) {
            StatusBar._update(vscode.window.activeTextEditor);
        }

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    StatusBar._update(editor);
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(() => {
                if (vscode.window.activeTextEditor) {
                    StatusBar._update(vscode.window.activeTextEditor);
                }
            })
        );

        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(() => {
                if (vscode.window.activeTextEditor) {
                    StatusBar._update(vscode.window.activeTextEditor);
                    StatusBar._updateCopilotStatusBarItem();
                }
            })
        );

        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("github.copilot.enable")) {
                StatusBar._updateCopilotStatusBarItem();
            }
        });
    }

    private static _getCopilotEnabled(): boolean {
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        if (!config) {
            return false;
        }

        let languageId: string = "*";
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            if (editor.document.languageId in config) {
                languageId = editor.document.languageId;
            }
        }
        return config[languageId];
    }

    private static _updateCopilotStatusBarItem(): void {
        StatusBar._statusBarCopilotItem.text = StatusBar._getCopilotEnabled() ? "$(copilot)" : "$(copilot-blocked)";
    }

    private static _update(editor: vscode.TextEditor): void {
        let matchStr = "N/A";
        const text = editor.document.getText(editor.selection);
        if (text.length !== 0 && text.indexOf("\n") === -1) {
            const escapedText = text.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
            const matches = editor.document.getText().match(new RegExp(escapedText, "g"));
            matchStr = matches !== null && matches.length > 0 ? `${matches.length}` : "N/A";
        }
        StatusBar._statusBarMatchesItem.text = `Matches: ${matchStr}`;
        StatusBar._statusBarMatchesItem.show();
        StatusBar._statusBarLineCountItem.text = `Line Count: ${editor.document.lineCount}`;
        StatusBar._statusBarLineCountItem.show();
    }
}
