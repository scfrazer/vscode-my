import * as vscode from 'vscode';

import { Util } from './util';
import { Language } from './language';
import { MatchingPair } from './matchingPair';

export class CursorMove {

    public static async wordLeft() {
        Util.updateSelections(CursorMove._wordPositionLeft, false);
    }

    public static async wordRight() {
        Util.updateSelections(CursorMove._wordPositionRight, false);
    }

    public static async expressionLeft() {
        Util.updateSelections(CursorMove._expressionPositionLeft, false);
    }

    public static async expressionRight() {
        Util.updateSelections(CursorMove._expressionPositionRight, false);
    }

    public static async selectExpressionLeft() {
        Util.updateSelections(CursorMove._wordOrExpressionPositionLeft, true);
    }

    public static async selectExpressionRight() {
        Util.updateSelections(CursorMove._wordOrExpressionPositionRight, true);
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
        Util.revealActivePosition(editor);
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
        Util.revealActivePosition(editor);
    }

    public static async home(args: any = {}) {
        Util.updateSelections(CursorMove._homePosition, args?.select && args.select);
    }

    private static _wordOrExpressionPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        const language = new Language(document.languageId);
        const lineNum = startPosition.line;
        let colNum = startPosition.character;
        if (colNum === 0) {
            return CursorMove._wordPositionLeft(document, startPosition);
        }
        const lineText = document.lineAt(lineNum).text;
        if (language.isCloser(lineText.charCodeAt(colNum - 1)) || language.isQuotes(lineText.charCodeAt(colNum - 1))) {
            return CursorMove._expressionPositionLeft(document, startPosition);
        }
        return CursorMove._wordPositionLeft(document, startPosition);
    }

    private static _wordOrExpressionPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        const language = new Language(document.languageId);
        const lineNum = startPosition.line;
        const colNum = startPosition.character;
        const lineText = document.lineAt(lineNum).text;
        if (language.isOpener(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
            return CursorMove._expressionPositionRight(document, startPosition);
        }
        return CursorMove._wordPositionRight(document, startPosition);
    }

    private static _wordPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        const delimiterReStr = language.getDelimiterReString() + '|[a-zA-Z0-9_]+';
        const delimiterRe = new RegExp(delimiterReStr, 'g');

        let lineNum = startPosition.line;
        let colNum = startPosition.character - 1;

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
                if (language.isCloser(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
                    colNum += 1;
                }
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

        const delimiterReStr = language.getDelimiterReString() + '|[a-zA-Z0-9_]+';
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

    private static _homePosition(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        const colNum = startPosition.character;
        const lineNum = startPosition.line;
        if (colNum > 0) {
            return new vscode.Position(lineNum, 0);
        }
        const lineText = document.lineAt(lineNum).text;
        const lineLen = lineText.length;
        for (let idx = 0; idx < lineLen; idx += 1) {
            const charCode = lineText.charCodeAt(idx);
            if (charCode !== 32 && charCode !== 9) {
                return (new vscode.Position(lineNum, idx));
            }
        }
        return (new vscode.Position(lineNum, lineLen));
    }
}
