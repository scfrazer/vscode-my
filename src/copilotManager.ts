import * as vscode from "vscode";

export class CopilotManager {
    private static _savedUris: Set<string> = new Set();
    private static _savedLanguageValues: Map<string, boolean | undefined> = new Map();
    private static _enabled: boolean = vscode.workspace
        .getConfiguration("my")
        .get<boolean>("enableCopilotManager", true);

    public static restoreAllCopilotSettings(): void {
        CopilotManager._savedUris.clear();
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        for (const [languageId, originalValue] of CopilotManager._savedLanguageValues) {
            config.update(languageId, originalValue, vscode.ConfigurationTarget.Global);
        }
        CopilotManager._savedLanguageValues.clear();
    }

    public static subscribeToChanges(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration("my.enableCopilotManager")) {
                    CopilotManager._enabled = vscode.workspace
                        .getConfiguration("my")
                        .get<boolean>("enableCopilotManager", true);
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (!CopilotManager._enabled) {
                    return;
                }
                const uriStr = doc.uri.toString();
                CopilotManager._savedUris.add(uriStr);
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.uri.toString() === uriStr) {
                    CopilotManager._disableCopilotForEditor(editor);
                }
            }),
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                const uriStr = event.document.uri.toString();
                if (CopilotManager._savedUris.has(uriStr)) {
                    if (!CopilotManager._enabled) {
                        CopilotManager._savedUris.delete(uriStr);
                        return;
                    }
                    CopilotManager._savedUris.delete(uriStr);
                    const editor = vscode.window.activeTextEditor;
                    if (editor && editor.document.uri.toString() === uriStr) {
                        CopilotManager._enableCopilotForEditor(editor);
                    }
                }
            }),
        );

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!editor) {
                    return;
                }
                if (!CopilotManager._enabled) {
                    return;
                }
                if (CopilotManager._savedUris.has(editor.document.uri.toString())) {
                    CopilotManager._disableCopilotForEditor(editor);
                } else {
                    CopilotManager._enableCopilotForEditor(editor);
                }
            }),
        );
    }

    private static _getCopilotEnabled(editor: vscode.TextEditor): boolean {
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        if (!config) {
            return false;
        }
        const languageId = editor.document.languageId;
        if (languageId in config) {
            return config[languageId] as boolean;
        }
        if ("*" in config) {
            return config["*"] as boolean;
        }
        return true;
    }

    private static _disableCopilotForEditor(editor: vscode.TextEditor): void {
        if (!CopilotManager._getCopilotEnabled(editor)) {
            return;
        }
        const languageId = editor.document.languageId;
        if (CopilotManager._savedLanguageValues.has(languageId)) {
            return;
        }
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        const inspection = config.inspect<boolean>(languageId);
        const currentGlobalValue = inspection?.globalValue;
        CopilotManager._savedLanguageValues.set(languageId, currentGlobalValue);
        config.update(languageId, false, vscode.ConfigurationTarget.Global);
    }

    private static _enableCopilotForEditor(editor: vscode.TextEditor): void {
        const languageId = editor.document.languageId;
        if (!CopilotManager._savedLanguageValues.has(languageId)) {
            return;
        }
        const originalValue = CopilotManager._savedLanguageValues.get(languageId);
        CopilotManager._savedLanguageValues.delete(languageId);
        const config = vscode.workspace.getConfiguration("github.copilot.enable");
        if (originalValue === undefined) {
            config.update(languageId, undefined, vscode.ConfigurationTarget.Global);
        } else {
            config.update(languageId, originalValue, vscode.ConfigurationTarget.Global);
        }
    }
}
