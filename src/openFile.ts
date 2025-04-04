import * as vscode from "vscode";

// FIXME
// export class ReferenceProvider implements vscode.ReferenceProvider {
//     public provideReferences(
//         document: vscode.TextDocument,
//         position: vscode.Position,
//         _context: vscode.ReferenceContext,
//         _token: vscode.CancellationToken
//     ): vscode.ProviderResult<vscode.Location[]> {
//         const symbolAtPos = Util.symbolAtPosition(document, position);
//         if (symbolAtPos === undefined) {
//             return undefined;
//         }
//         if (symbolAtPos.match(/^root_id=\d+$/) === null) {
//             return undefined;
//         }

//         const references: Array<vscode.Location> = [];
//         const symbolRe = new RegExp("\\b" + symbolAtPos + "\\b");
//         const lineCount = document.lineCount;
//         for (let lineNum = 0; lineNum < lineCount; lineNum++) {
//             const lineText = document.lineAt(lineNum).text;
//             const match = lineText.match(symbolRe);
//             if (match !== null) {
//                 references.push(new vscode.Location(document.uri, document.lineAt(lineNum).range));
//             }
//         }
//         return references;
//     }
// }

export class OpenFile {
    public static async underCursor() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const lineText = document.lineAt(position.line).text;

        let candidate = "";

        const beforeText = lineText.slice(0, position.character);
        const beforeRegex = /(?<envVar>~|\$([A-Z_]+\b)|\$\{([A-Z_]+)\}|\$\(([A-Z_]+)\))?(?<path>[-a-zA-Z0-9_./\\]+)$/;
        const beforeMatch = beforeRegex.exec(beforeText);
        if (beforeMatch) {
            candidate = beforeMatch[0];
        }

        candidate += lineText.slice(position.character);
        const fullRegex =
            /^(?<envVar>~|\$([A-Z_]+\b)|\$\{([A-Z_]+)\}|\$\(([A-Z_]+)\))?(?<path>[-a-zA-Z0-9_./\\]+)(?:\s*[:,@;{([]\s*(?<line>\d+))?/;
        const fullMatch = fullRegex.exec(candidate);
        if (!fullMatch) {
            vscode.window.showErrorMessage("No filename found under cursor.");
            return;
        }

        let filename = (fullMatch.groups?.envVar || "") + fullMatch.groups?.path;

        let lineNumber = 0;
        if (fullMatch.groups?.line) {
            lineNumber = parseInt(fullMatch.groups.line, 10) - 1;
        }

        // Replace tilde with $HOME
        filename = filename.replace(/~/g, process.env.HOME || process.env.HOMEPATH || "");

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
        const relativePath = vscode.workspace.asRelativePath(fullPath);
        const documentUri = vscode.Uri.file(relativePath);

        try {
            await vscode.workspace.fs.stat(documentUri);
            await OpenFile.openUriAtLine(fullPath, lineNumber);
        } catch (error) {
            vscode.window.showErrorMessage(`Error opening file: ${error}`);
        }
    }

    public static async openUriAtLine(uri: vscode.Uri, line: number = 0) {
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
}

// C:\Users\scfrazer\Documents\VSCode\vscode-my\src\extension.ts
