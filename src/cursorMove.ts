import * as vscode from 'vscode';

import { Util } from './util';
import { Language } from './language';
import { MatchingPair } from './matchingPair';

export class CursorMove {

    public static async wordLeft() {
        CursorMove._updateSelections(CursorMove._wordPositionLeft, false);
    }

    public static async wordRight() {
        CursorMove._updateSelections(CursorMove._wordPositionRight, false);
    }

    public static async expressionLeft() {
        CursorMove._updateSelections(CursorMove._expressionPositionLeft, false);
    }

    public static async expressionRight() {
        CursorMove._updateSelections(CursorMove._expressionPositionRight, false);
    }

    public static async selectExpressionLeft() {
        CursorMove._updateSelections(CursorMove._expressionPositionLeft, true);
    }

    public static async selectExpressionRight() {
        CursorMove._updateSelections(CursorMove._expressionPositionRight, true);
    }

    public static async deleteExpressionLeft() {
        CursorMove._deleteExpression(CursorMove._expressionPositionLeft);
    }

    public static async deleteExpressionRight() {
        CursorMove._deleteExpression(CursorMove._expressionPositionRight);
    }

    public static async selectToChar() {
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
                    // TODO Handle comments somehow
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

    public static async previousParagraph(args: any = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        let lineNum = editor.selection.active.line;
        if (lineNum > 0) {
            lineNum -= 1;
            while (lineNum > 0 && document.lineAt(lineNum).isEmptyOrWhitespace) {
                lineNum -= 1;
            }
            while (lineNum > 0) {
                lineNum -= 1;
                if (document.lineAt(lineNum).isEmptyOrWhitespace) {
                    lineNum += 1;
                    break;
                }
            }
        }
        let newPosition = new vscode.Position(lineNum, 0);
        if (args?.select && args.select) {
            editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
        }
        else {
            editor.selection = new vscode.Selection(newPosition, newPosition);
        }
        await vscode.commands.executeCommand<void>("revealLine", { lineNumber: lineNum });
    }

    public static async nextParagraph(args: any = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const lastLineNum = document.lineCount - 1;
        let lineNum = editor.selection.active.line;
        let startingAtEmpty = document.lineAt(lineNum).isEmptyOrWhitespace;
        while (1) {
            if (lineNum === lastLineNum) {
                break;
            }
            lineNum += 1;
            const line = document.lineAt(lineNum);
            if (startingAtEmpty) {
                if (!line.isEmptyOrWhitespace) {
                    break;
                }
            }
            else if (line.isEmptyOrWhitespace) {
                startingAtEmpty = true;
            }
        }
        let newPosition = new vscode.Position(lineNum, 0);
        if (args?.select && args.select) {
            editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
        }
        else {
            editor.selection = new vscode.Selection(newPosition, newPosition);
        }
        await vscode.commands.executeCommand<void>("revealLine", { lineNumber: lineNum });
    }

    private static _updateSelections(positionFunction: (document: vscode.TextDocument, startPosition: vscode.Position) => vscode.Position | undefined, select: boolean) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            const newPosition = positionFunction(document, selection.active);
            if (newPosition === undefined) {
                return selection;
            }
            return (new vscode.Selection((select || !selection.isEmpty) ? selection.anchor : newPosition, newPosition));
        });
        vscode.commands.executeCommand<void>("revealLine", { lineNumber: editor.selection.active.line });
    }

    private static _deleteExpression(positionFunction: (document: vscode.TextDocument, startPosition: vscode.Position) => vscode.Position | undefined) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {
                const newPosition = positionFunction(document, selection.active);
                if (newPosition === undefined) {
                    return;
                }
                const range = new vscode.Range(selection.anchor, newPosition);
                editBuilder.delete(range);
            });
        });
    }

    private static _wordPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        const delimiterReStr = language.getDelimiterReString() + '|\\w+';
        const delimiterRe = new RegExp(delimiterReStr, 'g');

        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let found = false;
        while (!found) {
            const lineText = document.lineAt(lineNum).text;
            const matches = [...lineText.matchAll(delimiterRe)].reverse();
            for (const match of matches) {
                if (match?.index === undefined || match.index >= colNum) {
                    continue;
                }
                found = true;
                colNum = match.index;
                break;
            }
            if (!found) {
                if (lineNum === 0) {
                    return undefined;
                }
                colNum = Number.MAX_SAFE_INTEGER;
                lineNum -= 1;
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private static _wordPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        const delimiterReStr = language.getDelimiterReString() + '|\\w+';
        const delimiterRe = new RegExp(delimiterReStr, 'g');

        const lastLineNum = document.lineCount - 1;
        let lineNum = startPosition.line;
        let colNum = startPosition.character + 1;

        let found = false;
        while (!found) {
            const lineText = document.lineAt(lineNum).text;
            const matches = lineText.matchAll(delimiterRe);
            for (const match of matches) {
                if (match?.index === undefined || match.index < colNum) {
                    continue;
                }
                found = true;
                colNum = match.index;
                break;
            }
            if (!found) {
                if (lineNum === lastLineNum) {
                    return undefined;
                }
                colNum = -1;
                lineNum += 1;
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private static _expressionPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        let lineNum = startPosition.line;
        let colNum = startPosition.character - 1;

        let lineText;
        if (colNum < 0) {
            if (lineNum === 0) {
                return undefined;
            }
            lineNum -= 1;
            lineText = document.lineAt(lineNum).text;
            colNum = lineText.length;
        }
        else {
            lineText = document.lineAt(lineNum).text;
        }
        if (language.isCloser(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
            return (MatchingPair.matchPositionLeft(document, startPosition));
        }
        if (language.isOpener(lineText.charCodeAt(colNum))) {
            return undefined;
        }

        let insideWord = language.isWord(lineText.charCodeAt(colNum));

        let found = false;
        while (!found) {
            for (let idx = colNum - 1; idx >= 0; idx -= 1) {
                const charCode = lineText.charCodeAt(idx);
                if (insideWord) {
                    if (!language.isWord(charCode)) {
                        found = true;
                        colNum = idx + 1;
                        break;
                    }
                }
                else if (language.isWord(charCode) || language.isQuotes(charCode) || language.isOpener(charCode) || language.isCloser(charCode)) {
                    found = true;
                    colNum = idx + 1;
                    break;
                }
            }
            if (!found) {
                if (insideWord) {
                    found = true;
                    colNum = 0;
                }
                else {
                    if (lineNum === 0) {
                        return undefined;
                    }
                    lineNum -= 1;
                    lineText = document.lineAt(lineNum).text;
                    colNum = lineText.length;
                }
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private static _expressionPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let lineText = document.lineAt(lineNum).text;
        if (language.isOpener(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
            const newPosition = MatchingPair.matchPositionRight(document, startPosition);
            if (newPosition === undefined) {
                return undefined;
            }
            return (new vscode.Position(newPosition.line, newPosition.character + 1));
        }

        const lastLineNum = document.lineCount - 1;
        let insideWord = language.isWord(lineText.charCodeAt(colNum));

        let found = false;
        while (!found) {
            const lineLen = lineText.length;
            for (let idx = colNum; idx < lineLen; idx += 1) {
                const charCode = lineText.charCodeAt(idx);
                if (insideWord) {
                    if (!language.isWord(charCode)) {
                        found = true;
                        colNum = idx;
                        break;
                    }
                }
                else if (language.isWord(charCode) || language.isQuotes(charCode) || language.isOpener(charCode) || language.isCloser(charCode)) {
                    found = true;
                    colNum = idx;
                    break;
                }
            }
            if (!found) {
                if (insideWord) {
                    found = true;
                    colNum = lineLen;
                }
                else {
                    if (lineNum === lastLineNum) {
                        return undefined;
                    }
                    colNum = 0;
                    lineNum += 1;
                    lineText = document.lineAt(lineNum).text;
                }
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }
}
