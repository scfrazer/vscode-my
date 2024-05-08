import * as vscode from "vscode";

import { Language } from "./language";
import { MatchingPair } from "./matchingPair";
import { Util } from "./util";

export class ToChar {
    public static async goto(args: any = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const select = args?.select && args.select;
        const cut = args?.cut && args.cut;
        const sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        if (select) {
            sbItem.text = "Select to character ...";
            sbItem.tooltip = "'Return' will exit without selecting";
        } else if (cut) {
            sbItem.text = "Cut to character ...";
            sbItem.tooltip = "'Return' will exit without cutting";
        } else {
            sbItem.text = "Go to character ...";
            sbItem.tooltip = "'Return' will exit without moving";
        }
        sbItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
        sbItem.show();

        let typeCommand = vscode.commands.registerCommand("type", (args) => {
            if (args.text === "\n") {
                sbItem.dispose();
                typeCommand.dispose();
                return;
            }

            const document = editor.document;
            editor.selections = editor.selections.map((selection) => {
                const newPosition = ToChar.upTo(document, selection.active, args.text);
                if (newPosition !== undefined) {
                    if (select || cut) {
                        return new vscode.Selection(editor.selection.anchor, newPosition);
                    } else {
                        return new vscode.Selection(newPosition, newPosition);
                    }
                }
                return selection;
            });

            sbItem.dispose();
            typeCommand.dispose();

            if (cut) {
                vscode.commands.executeCommand<void>("editor.action.clipboardCutAction");
            }
        });

        Util.revealActivePosition(editor);
    }

    public static async delete() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        sbItem.text = "Delete to character ...";
        sbItem.tooltip = "'Return' will exit without deleting";
        sbItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
        sbItem.show();

        let typeCommand = vscode.commands.registerCommand("type", (args) => {
            if (args.text === "\n") {
                sbItem.dispose();
                typeCommand.dispose();
                return;
            }
            const document = editor.document;
            editor.edit((editBuilder) => {
                editor.selections.map((selection) => {
                    const newPosition = ToChar.upTo(document, selection.active, args.text);
                    if (newPosition !== undefined) {
                        const range = new vscode.Range(selection.anchor, newPosition);
                        editBuilder.delete(range);
                    }
                });
            });
            sbItem.dispose();
            typeCommand.dispose();
        });
    }

    public static upTo(
        document: vscode.TextDocument,
        startPosition: vscode.Position,
        text: string
    ): vscode.Position | undefined {
        const language = new Language(document.languageId);

        const lastLineNum = document.lineCount - 1;
        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let jumpOverPair = false;
        let found = false;
        while (!found) {
            const lineText = document.lineAt(lineNum).text;
            const lineLen = lineText.length;
            for (let idx = colNum; idx < lineLen; idx += 1) {
                if (lineText.charAt(idx) === text) {
                    found = true;
                    colNum = idx;
                    break;
                } else if (language.isOpener(lineText.charCodeAt(idx)) || language.isQuotes(lineText.charCodeAt(idx))) {
                    jumpOverPair = true;
                    colNum = idx;
                    break;
                }
            }
            if (jumpOverPair) {
                let newPosition = MatchingPair.matchPositionRight(document, new vscode.Position(lineNum, colNum));
                if (newPosition === undefined) {
                    return undefined;
                }
                jumpOverPair = false;
                colNum = newPosition.character + 1;
                lineNum = newPosition.line;
                continue;
            }
            if (!found) {
                if (lineNum === lastLineNum) {
                    return undefined;
                }
                colNum = 0;
                lineNum += 1;
            }
        }

        if (found) {
            return new vscode.Position(lineNum, colNum);
        }
        return undefined;
    }
}
