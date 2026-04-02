import * as vscode from "vscode";

export class CopilotManager {
    private static _enabled: boolean = vscode.workspace
        .getConfiguration("my")
        .get<boolean>("enableCopilotManager", true);
    private static _completionsEnabled: boolean = true;

    public static subscribeToChanges(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration("my.enableCopilotManager")) {
                    CopilotManager._enabled = vscode.workspace
                        .getConfiguration("my")
                        .get<boolean>("enableCopilotManager", true);
                }
                if (!CopilotManager._completionsEnabled) {
                    vscode.commands.executeCommand("github.copilot.chat.completions.enable");
                    CopilotManager._completionsEnabled = true;
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((doc) => {
                CopilotManager._enableOrDisable(vscode.window.activeTextEditor);
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                CopilotManager._enableOrDisable(vscode.window.activeTextEditor);
            }),
        );

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                CopilotManager._enableOrDisable(editor);
            }),
        );
    }

    private static _enableOrDisable(editor: vscode.TextEditor | undefined) {
        if (!CopilotManager._enabled) {
            return;
        }
        if (editor) {
            if (!CopilotManager._completionsEnabled && editor.document.isDirty) {
                vscode.commands.executeCommand("github.copilot.chat.completions.enable");
                CopilotManager._completionsEnabled = true;
            } else if (CopilotManager._completionsEnabled && !editor.document.isDirty) {
                vscode.commands.executeCommand("github.copilot.chat.completions.disable");
                CopilotManager._completionsEnabled = false;
            }
        }
    }
}
