import * as vscode from 'vscode';

import { Language } from './language';
import { MatchingPair } from './matchingPair';

export class ToChar {

    public static async select() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        sbItem.text = "Select to character ...";
        sbItem.tooltip = "'Return' will exit without selecting";
        sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        sbItem.show();

        let typeCommand = vscode.commands.registerCommand('type', args => {
            if (args.text === '\n') {
                sbItem.dispose();
                typeCommand.dispose();
                return;
            }

            const document = editor.document;
            editor.selections = editor.selections.map((selection) => {
                const language = new Language(document.languageId);

                const lastLineNum = document.lineCount - 1;
                let lineNum = selection.active.line;
                let colNum = selection.active.character;

                let jumpOverPair = false;
                let found = false;
                while (!found) {
                    const lineText = document.lineAt(lineNum).text;
                    const lineLen = lineText.length;
                    for (let idx = colNum; idx < lineLen; idx += 1) {
                        if (lineText.charAt(idx) === args.text) {
                            found = true;
                            colNum = idx;
                            break;
                        }
                        else if (language.isOpener(lineText.charCodeAt(idx)) || language.isQuotes(lineText.charCodeAt(idx))) {
                            jumpOverPair = true;
                            colNum = idx;
                            break;
                        }
                    }
                    if (jumpOverPair) {
                        let newPosition = MatchingPair.matchPositionRight(document, new vscode.Position(lineNum, colNum));
                        if (newPosition === undefined) {
                            return selection;
                        }
                        jumpOverPair = false;
                        colNum = newPosition.character + 1;
                        lineNum = newPosition.line;
                        continue;
                    }
                    if (!found) {
                        if (lineNum === lastLineNum) {
                            return selection;
                        }
                        colNum = 0;
                        lineNum += 1;
                    }
                }

                if (found) {
                    return (new vscode.Selection(selection.anchor, new vscode.Position(lineNum, colNum)));
                }
                return selection;
            });

            sbItem.dispose();
            typeCommand.dispose();
        });
        vscode.commands.executeCommand<void>("revealLine", { lineNumber: editor.selection.active.line });
    }
}
