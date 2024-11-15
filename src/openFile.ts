import * as vscode from "vscode";

export class OpenFile {
    public static async underCursor() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const lineText = document.lineAt(position.line).text;

        // TODO: Capture and expand $(FOO) or ${FOO} or $FOO or $ENV{FOO} from env variables

        const beforeRegex = /([-a-zA-Z0-9_./]+)$/;
        const afterRegex = /^([-a-zA-Z0-9_./]+)(?:[:,@;{([]\s*(\d+))?/;
        let filename = "";
        let lineNumber = 0;

        const beforeText = lineText.slice(0, position.character);
        const beforeMatch = beforeRegex.exec(beforeText);
        if (beforeMatch) {
            filename = beforeMatch[1];
        }

        const afterText = lineText.slice(position.character);
        const afterMatch = afterRegex.exec(afterText);
        if (afterMatch) {
            filename += afterMatch[1];
            if (afterMatch[2]) {
                lineNumber = parseInt(afterMatch[2], 10);
            }
        }

        if (filename) {
            const fullPath = vscode.Uri.file(filename);
            try {
                await vscode.workspace.fs.stat(fullPath);
                await OpenFile.openUriAtLine(fullPath, lineNumber);
            } catch (error) {
                // vscode.window.showErrorMessage(`File not found: ${filename}`);
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        } else {
            vscode.window.showInformationMessage("No filename found under cursor.");
        }
    }

    public static async openUriAtLine(uri: vscode.Uri, line: number = 0) {
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
    }
}
