import * as vscode from 'vscode';

export class Complete {

    public static async currentWord() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
    }
}
