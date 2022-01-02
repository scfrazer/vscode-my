import * as vscode from 'vscode';

export class Misc {

    public static addCursorsToLineStarts() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let firstLine = editor.selection.start.line;
        let lastLine = editor.selection.end.line;
        let selections: Array<vscode.Selection> = [];
        for (let lineNum = firstLine; lineNum < lastLine; lineNum += 1) {
            if (!editor.document.lineAt(lineNum).isEmptyOrWhitespace) {
                let position = new vscode.Position(lineNum, 0);
                selections.push(new vscode.Selection(position, position));
            }
        }
        editor.selections = selections;
    }

    // TODO: Tab out of \s*])}>'"

    // TODO: Search in current file
    // export function activate(context: vscode.ExtensionContext) {
    //     let disposable = vscode.commands.registerCommand(
    //       "search-in-current-file.searchInCurrentFile",
    //       async () => {
    //         await searchInCurrentFile();
    //       }
    //     );
    //
    //     context.subscriptions.push(disposable);
    //   }
    //
    //   export function deactivate() {}
    //
    //   async function searchInCurrentFile(): Promise<void> {
    //     const activeEditor = vscode.window.activeTextEditor;
    //     if (!activeEditor) {
    //       return;
    //     }
    //
    //     const currentFilePath = vscode.workspace.asRelativePath(
    //       activeEditor.document.uri
    //     );
    //     await vscode.commands.executeCommand("workbench.action.findInFiles", {
    //       // Fill-in selected text to query
    //       query: activeEditor.document.getText(activeEditor.selection),
    //       filesToInclude: currentFilePath,
    //     });
    //   }

    // TODO: Center window center/top/bottom
    //     let state = "center";
    //     let timeout;
    //
    //     function reset() {
    //       if (timeout) clearTimeout(timeout);
    //
    //       timeout = setTimeout(() => {
    //         state = "center";
    //       }, 1000);
    //     }
    //
    //     vscode.window.onDidChangeActiveTextEditor(() => {
    //       clearTimeout(timeout);
    //       state = "center";
    //     });
    //
    //     let disposable = vscode.commands.registerCommand(
    //       "center-editor-window.center",
    //       () => {
    //         if (
    //           vscode.workspace
    //             .getConfiguration("center-editor-window")
    //             .get("threeStateToggle")
    //         ) {
    //           switch (state) {
    //             case "center":
    //               toCenter();
    //               state = "top";
    //               reset();
    //               break;
    //             case "top":
    //               toTop();
    //               state = "bottom";
    //               reset();
    //               break;
    //             case "bottom":
    //               toBottom();
    //               state = "center";
    //               reset();
    //               break;
    //           }
    //         } else {
    //           toCenter();
    //         }
    //       }
    //     );
    //
    //     context.subscriptions.push(disposable);
    //   }
    //
    //   async function toCenter() {
    //     let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
    //     let offset = +vscode.workspace
    //       .getConfiguration("center-editor-window")
    //       .get("offset");
    //     await vscode.commands.executeCommand("revealLine", {
    //       lineNumber: currentLineNumber + offset,
    //       at: "center"
    //     });
    //   }
    //
    //   async function toTop() {
    //     let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
    //     await vscode.commands.executeCommand("revealLine", {
    //       lineNumber: currentLineNumber,
    //       at: "top"
    //     });
    //   }
    //
    //   async function toBottom() {
    //     let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
    //     await vscode.commands.executeCommand("revealLine", {
    //       lineNumber: currentLineNumber,
    //       at: "bottom"
    //     });
    // }
}
