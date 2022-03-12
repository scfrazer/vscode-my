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
        if (editor.selections.length === 1) {
            const selection = Misc._maybeTabOutSelection(document, editor.selection, language);
            if (selection !== undefined) {
                editor.selection = selection;
            }
            else {
                vscode.commands.executeCommand<void>("tab");
            }
        }
        else {
            editor.selections = editor.selections.map((selection) => {
                const newSelection = Misc._maybeTabOutSelection(document, selection, language);
                if (newSelection !== undefined) {
                    return newSelection;
                }
                return selection;
            });
        }
    }

    private static _maybeTabOutSelection(document: vscode.TextDocument, selection: vscode.Selection, language: Language): vscode.Selection | undefined {
        const lineText = document.lineAt(selection.active).text;
        const charCode = lineText.charCodeAt(selection.active.character);
        if (selection.active.character > 0 && (language.isCloser(charCode) || language.isQuotes(charCode))) {
            let newPosition = selection.active.translate(0, 1);
            return (new vscode.Selection(newPosition, newPosition));
        }
        return undefined;
    }

    public static async findInCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        await vscode.commands.executeCommand("workbench.action.findInFiles", {
            query: editor.document.getText(editor.selection),
            filesToInclude: vscode.workspace.asRelativePath(editor.document.uri),
            triggerSearch: true,
            focusResults: true,
        });
    }

    public static centerCursorLine() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        vscode.commands.executeCommand("revealLine", {
            lineNumber: editor.selection.active.line,
            at: "center"
        });
    }

    public static async googleSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.document.getText(editor.selection);
        const uriText = encodeURI(selection);
        const query = `https://www.google.com/search?q=${uriText}`;
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(query));
    }

    // New features
    // TODO: Delete pair -- ctrl+k -
    // TODO: Reformat list

    // Provided by extensions
    // TODO: Remove extra blank lines and trailing whitespace
}
