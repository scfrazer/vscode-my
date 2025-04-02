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
        StatusBar._updateCopilotStatusBarItem(vscode.window.activeTextEditor);

        context.subscriptions.push(StatusBar._statusBarMatchesItem);
        context.subscriptions.push(StatusBar._statusBarLineCountItem);
        context.subscriptions.push(StatusBar._statusBarCopilotItem);

        if (vscode.window.activeTextEditor) {
            StatusBar._update(vscode.window.activeTextEditor);
        }

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    StatusBar._update(editor);
                    StatusBar._updateCopilotStatusBarItem(editor);
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
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration("github.copilot.enable")) {
                    StatusBar._updateCopilotStatusBarItem(vscode.window.activeTextEditor);
                }
            })
        );
    }

    private static _getCopilotEnabled(editor: vscode.TextEditor | undefined): boolean {
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        if (!config) {
            return false;
        }

        let languageId: string = "*";
        if (editor) {
            if (editor.document.languageId in config) {
                languageId = editor.document.languageId;
            }
        }
        return config[languageId];
    }

    private static _updateCopilotStatusBarItem(editor: vscode.TextEditor | undefined): void {
        const enabled = StatusBar._getCopilotEnabled(editor);
        StatusBar._statusBarCopilotItem.text = enabled ? "$(copilot)" : "$(copilot-blocked)";
        StatusBar._statusBarCopilotItem.tooltip = enabled ? "Copilot enabled" : "Copilot disabled";
        StatusBar._statusBarCopilotItem.show();
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
