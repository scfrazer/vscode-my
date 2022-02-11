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
        Util.updateSelections(CursorMove._expressionPositionLeft, true);
    }

    public static async selectExpressionRight() {
        Util.updateSelections(CursorMove._expressionPositionRight, true);
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
            const startPosition = editor.selection.anchor.with(undefined, 0);
            editor.selection = new vscode.Selection(startPosition, newPosition);
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
            const startPosition = editor.selection.anchor.with(undefined, 0);
            editor.selection = new vscode.Selection(startPosition, newPosition);
        }
        else {
            editor.selection = new vscode.Selection(newPosition, newPosition);
        }
        Util.revealActivePosition(editor);
    }

    public static async home(args: any = {}) {
        Util.updateSelections(CursorMove._homePosition, args?.select && args.select);
    }

    private static _wordPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lineNum = startPosition.line;

        if (startPosition.character === 0) {
            if (lineNum > 0) {
                return (document.lineAt(lineNum - 1).range.end);
            }
            return undefined;
        }

        const language = new Language(document.languageId);
        const delimiterReStr = language.getDelimiterReString() + '|[a-zA-Z0-9_]+';
        const delimiterRe = new RegExp(delimiterReStr, 'g');

        let colNum = startPosition.character - 1;

        const lineText = document.lineAt(lineNum).text;
        const matches = [...lineText.matchAll(delimiterRe)].reverse();
        for (const match of matches) {
            if (match?.index === undefined || match.index >= colNum) {
                continue;
            }
            colNum = match.index;
            if (language.isCloser(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
                colNum += 1;
            }
            return (new vscode.Position(lineNum, colNum));
        }
        return (new vscode.Position(lineNum, 0));
    }

    private static _wordPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lineNum = startPosition.line;
        const lineText = document.lineAt(lineNum).text;

        if (startPosition.character === lineText.length) {
            if (lineNum === (document.lineCount - 1)) {
                return undefined;
            }
            return (new vscode.Position(lineNum + 1, 0));
        }

        const language = new Language(document.languageId);
        const delimiterReStr = language.getDelimiterReString() + '|[a-zA-Z0-9_]+';
        const delimiterRe = new RegExp(delimiterReStr, 'g');

        let colNum = startPosition.character + 1;

        const matches = lineText.matchAll(delimiterRe);
        for (const match of matches) {
            if (match?.index === undefined || match.index < colNum) {
                continue;
            }
            return (new vscode.Position(lineNum, match.index));
        }
        return (new vscode.Position(lineNum, lineText.length));
    }

    private static _expressionPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const language = new Language(document.languageId);

        const lineNum = startPosition.line;
        const colNum = startPosition.character - 1;

        if (colNum < 0) {
            if (lineNum === 0) {
                return undefined;
            }
            return (document.lineAt(lineNum - 1).range.end);
        }

        let lineText = document.lineAt(lineNum).text;
        if (language.isCloser(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
            return (MatchingPair.matchPositionLeft(document, startPosition));
        }
        if (language.isOpener(lineText.charCodeAt(colNum))) {
            return undefined;
        }

        let insideWord = language.isWord(lineText.charCodeAt(colNum));

        for (let idx = colNum - 1; idx >= 0; idx -= 1) {
            const charCode = lineText.charCodeAt(idx);
            if (insideWord) {
                if (!language.isWord(charCode)) {
                    return (new vscode.Position(lineNum, idx + 1));
                }
            }
            else if (language.isWord(charCode) || language.isQuotes(charCode) || language.isOpener(charCode) || language.isCloser(charCode)) {
                return (new vscode.Position(lineNum, idx + 1));
            }
        }
        return (new vscode.Position(lineNum, 0));
    }

    private static _expressionPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lineNum = startPosition.line;
        const lineText = document.lineAt(lineNum).text;

        if (startPosition.character === lineText.length) {
            if (lineNum === (document.lineCount - 1)) {
                return undefined;
            }
            return (new vscode.Position(lineNum + 1, 0));
        }

        const language = new Language(document.languageId);
        let colNum = startPosition.character;

        if (language.isOpener(lineText.charCodeAt(colNum)) || language.isQuotes(lineText.charCodeAt(colNum))) {
            const newPosition = MatchingPair.matchPositionRight(document, startPosition);
            if (newPosition === undefined) {
                return undefined;
            }
            return (newPosition.translate(0, 1));
        }
        if (language.isCloser(lineText.charCodeAt(colNum))) {
            return undefined;
        }

        let insideWord = language.isWord(lineText.charCodeAt(colNum));

        const lineLen = lineText.length;
        for (let idx = colNum; idx < lineLen; idx += 1) {
            const charCode = lineText.charCodeAt(idx);
            if (insideWord) {
                if (!language.isWord(charCode)) {
                    return (new vscode.Position(lineNum, idx));
                }
            }
            else if (language.isWord(charCode) || language.isQuotes(charCode) || language.isOpener(charCode) || language.isCloser(charCode)) {
                return (new vscode.Position(lineNum, idx));
            }
        }
        return (new vscode.Position(lineNum, lineLen));
    }

    private static _homePosition(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        const colNum = startPosition.character;
        const lineNum = startPosition.line;
        if (colNum > 0) {
            return new vscode.Position(lineNum, 0);
        }
        return (new vscode.Position(lineNum, document.lineAt(lineNum).firstNonWhitespaceCharacterIndex));
    }
}
