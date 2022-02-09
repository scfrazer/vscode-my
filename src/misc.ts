import * as vscode from 'vscode';

import { Language } from './language';
import { Util } from './util';

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

    public static addSemicolonToEndOfLine() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {
                let range = document.lineAt(selection.active).range;
                editBuilder.insert(range.end, ";");
            });
        }).then((success) => {
            if (!success) {
                return;
            }
            editor.selections = editor.selections.map((selection) => {
                if (selection.active.isEqual(document.lineAt(selection.active).range.end)) {
                    let newPosition = selection.active.translate(0, -1);
                    return (new vscode.Selection(newPosition, newPosition));
                }
                return selection;
            });
        });
    }

    public static justOneSpace() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {
                const lineText = document.lineAt(selection.active).text;
                const lineLen = lineText.length;
                const currCol = selection.active.character;

                let endCol = currCol;
                for (let idx = currCol; idx < lineLen; idx += 1) {
                    endCol = idx;
                    if (Util.isWhitespace(lineText.charCodeAt(idx))) {
                        continue;
                    }
                    break;
                }
                let startCol = currCol;
                for (let idx = currCol - 1; idx >= 0; idx -= 1) {
                    if (Util.isWhitespace(lineText.charCodeAt(idx))) {
                        startCol = idx;
                        continue;
                    }
                    break;
                }
                if (endCol - startCol < 2) {
                    return;
                }

                const startPosition = selection.active.with(undefined, startCol);
                const endPosition = selection.active.with(undefined, endCol);
                const range = new vscode.Range(startPosition, endPosition);
                editBuilder.replace(range, " ");
            });
        });
    }

    public static gotoLine() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        vscode.window.showInputBox({ title: "Go to line number" }).then(input => {
            if (input === undefined) {
                return;
            }
            let lineNum = Number(input);
            if (lineNum === undefined) {
                return;
            }
            if (lineNum < 1) {
                lineNum = 1;
            }
            else if (lineNum > document.lineCount) {
                lineNum = document.lineCount;
            }
            const position = new vscode.Position(lineNum - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            Util.revealActivePosition(editor);
        });
    }

    public static smartTab() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const language = new Language(document.languageId);
        editor.selections = editor.selections.map((selection) => {
            const lineText = document.lineAt(selection.active).text;
            const charCode = lineText.charCodeAt(selection.active.character);
            if (selection.active.character > 0 && (language.isCloser(charCode) || language.isQuotes(charCode))) {
                let newPosition = selection.active.translate(0, 1);
                return (new vscode.Selection(newPosition, newPosition));
            }
            else if (editor.selections.length === 1) {
                vscode.commands.executeCommand<void>("tab");
            }
            return selection;
        });
    }

    // Refactoring
    // TODO: document.lineAt(position) instead of position.line

    // dabbrev
    // TODO: document filename as static index
    // TODO: completion workspace on did close text document

    // New features
    // TODO: VCS breakpoint copy to env.clipboard
    // TODO: Delete pair
    // TODO: Change pair
    // TODO: Reformat list
    // TODO: Close all editors w/o an associated file

    // Provided by extensions
    // TODO: Center window center/top/bottom
    // TODO: Search in current file
    // TODO: Remove extra blank lines and trailing whitespace

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
