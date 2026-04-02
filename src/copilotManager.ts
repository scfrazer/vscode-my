import * as vscode from "vscode";

export class CopilotManager {
    private static _enabled: boolean = vscode.workspace
        .getConfiguration("my")
        .get<boolean>("enableCopilotManager", true);

    public static subscribeToChanges(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration("my.enableCopilotManager")) {
                    CopilotManager._enabled = vscode.workspace
                        .getConfiguration("my")
                        .get<boolean>("enableCopilotManager", true);
                }
                if (CopilotManager._enabled) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        if (editor.document.isDirty) {
                            vscode.commands.executeCommand("github.copilot.chat.completions.enable");
                        } else {
                            vscode.commands.executeCommand("github.copilot.chat.completions.disable");
                        }
                    }
                } else {
                    vscode.commands.executeCommand("github.copilot.chat.completions.disable");
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    vscode.commands.executeCommand("github.copilot.chat.completions.disable");
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.isDirty) {
                    vscode.commands.executeCommand("github.copilot.chat.completions.enable");
                }
            }),
        );

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!editor || !CopilotManager._enabled) {
                    return;
                }
                if (editor.document.isDirty) {
                    vscode.commands.executeCommand("github.copilot.chat.completions.enable");
                } else {
                    vscode.commands.executeCommand("github.copilot.chat.completions.disable");
                }
            }),
        );
    }
}
