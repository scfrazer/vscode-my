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
                lineNumber = parseInt(afterMatch[2], 10) - 1;
            }
        }

        if (filename) {
            // Replace tilde with $HOME
            filename = filename.replace(/~/g, process.env.HOME || "");

            // Expand environment variables
            filename = filename.replace(
                /\$([A-Z_]+\b)|\$\{([A-Z_]+)\}|\$\(([A-Z_]+)\)/g,
                (_, plainEnvVar, curlyEnvVar, roundEnvVar) => {
                    return process.env[plainEnvVar || curlyEnvVar || roundEnvVar] || "";
                }
            );

            // Normalize the path to use forward slashes and replace multiple slashes with a single slash
            const normalizedPath = filename.replace(/\\/g, "/").replace(/\/+/g, "/");
            let fullPath: vscode.Uri;

            if (vscode.env.remoteName) {
                const remoteAuthority = vscode.env.remoteName;
                fullPath = vscode.Uri.parse(`vscode-remote://${remoteAuthority}${normalizedPath}`);
            } else {
                fullPath = vscode.Uri.file(normalizedPath);
            }

            try {
                await vscode.workspace.fs.stat(fullPath);
                await OpenFile.openUriAtLine(fullPath, lineNumber);
            } catch (error) {
                vscode.window.showErrorMessage(`Error opening file: ${error}`);
            }
        } else {
            vscode.window.showErrorMessage("No filename found under cursor.");
        }
    }

    public static async openUriAtLine(uri: vscode.Uri, line: number) {
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
}
