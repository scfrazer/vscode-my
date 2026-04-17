import * as vscode from "vscode";

export class CopilotManager {
    private static _enabled: boolean = vscode.workspace
        .getConfiguration("my")
        .get<boolean>("enableCopilotManager", true);
    private static _completionsEnabled: boolean = vscode.workspace
        .getConfiguration("github.copilot")
        .get<boolean>("inlineSuggest.enable", true);
    private static _timeout: number = vscode.workspace
        .getConfiguration("my")
        .get<number>("copilotManagerTimeout", 1500);
    private static _debounceTimer: NodeJS.Timeout | undefined;

    public static subscribeToChanges(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration("my.enableCopilotManager")) {
                    CopilotManager._enabled = vscode.workspace
                        .getConfiguration("my")
                        .get<boolean>("enableCopilotManager", true);
                    CopilotManager._clearDebounceTimeout();
                }
                if (event.affectsConfiguration("my.copilotManagerTimeout")) {
                    CopilotManager._timeout = vscode.workspace
                        .getConfiguration("my")
                        .get<number>("copilotManagerTimeout", 1500);
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((_doc) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                CopilotManager._clearDebounceTimeout();
                CopilotManager._disable();
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((_event) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                CopilotManager._clearDebounceTimeout();
                CopilotManager._disable();
                CopilotManager._debounceTimer = setTimeout(
                    CopilotManager._onDebounceTimeout,
                    CopilotManager._timeout,
                );
            }),
        );

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                CopilotManager._clearDebounceTimeout();
                if (!editor) {
                    return;
                }
                if (!CopilotManager._completionsEnabled && editor.document.isDirty) {
                    CopilotManager._enable();
                } else if (CopilotManager._completionsEnabled && !editor.document.isDirty) {
                    CopilotManager._disable();
                }
            }),
        );
    }

    private static _clearDebounceTimeout(): void {
        if (CopilotManager._debounceTimer) {
            clearTimeout(CopilotManager._debounceTimer);
            CopilotManager._debounceTimer = undefined;
        }
    }

    private static _onDebounceTimeout(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.isDirty) {
            CopilotManager._enable();
        }
    }

    private static _enable(): void {
        if (!CopilotManager._completionsEnabled) {
            CopilotManager._completionsEnabled = true;
            vscode.commands.executeCommand("github.copilot.chat.completions.enable");
        }
    }

    private static _disable(): void {
        if (CopilotManager._completionsEnabled) {
            CopilotManager._completionsEnabled = false;
            vscode.commands.executeCommand("github.copilot.chat.completions.disable");
            vscode.commands.executeCommand("editor.action.inlineSuggest.hide");
        }
    }
}
