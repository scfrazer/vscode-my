import * as vscode from 'vscode';

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

    public static async deleteExpressionLeft() {  // TODO
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const lineText = document.lineAt(startPosition.line).text;
        const charStr = lineText[startPosition.character - 1];
        if (MatchingPair.isQuotesCharCode(charStr.charCodeAt(0)) || MatchingPair.isCloserCharCode(charStr.charCodeAt(0))) {
            const matchPosition = MatchingPair.matchPositionLeft(document, startPosition);
            if (matchPosition !== undefined) {
                const newPosition = new vscode.Position(matchPosition.line, matchPosition.character);
                editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
                await vscode.commands.executeCommand<void>("editor.action.clipboardCutAction");
            }
        }
        else {
            await vscode.commands.executeCommand<void>("deleteWordLeft");
        }
    }

    public static async deleteExpressionRight() {  // TODO
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const lineText = document.lineAt(startPosition.line).text;
        const charStr = lineText[startPosition.character];
        if (/\s/.test(charStr)) {
            await vscode.commands.executeCommand<void>("deleteWordStartRight");
        }
        else if (MatchingPair.isQuotesCharCode(charStr.charCodeAt(0)) || MatchingPair.isOpenerCharCode(charStr.charCodeAt(0))) {
            const matchPosition = MatchingPair.matchPositionRight(document, startPosition);
            if (matchPosition !== undefined) {
                const newPosition = new vscode.Position(matchPosition.line, matchPosition.character + 1);
                editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
                await vscode.commands.executeCommand<void>("editor.action.clipboardCutAction");
            }
        }
        else {
            await vscode.commands.executeCommand<void>("deleteWordRight");
        }
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
    }

    private static _wordPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let lineText = document.lineAt(lineNum).text;
        let insideWord = false;

        let found = false;
        while (!found) {
            for (let idx = colNum - 1; idx >= 0; idx -= 1) {
                if (insideWord) {
                    if (!CursorMove._isWordCharCode(lineText.charCodeAt(idx))) {
                        found = true;
                        colNum = idx + 1;
                        break;
                    }
                }
                else if (CursorMove._isWordCharCode(lineText.charCodeAt(idx))) {
                    insideWord = true;
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
                    insideWord = false;
                    colNum = lineText.length;
                }
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private static _wordPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lastLineNum = document.lineCount - 1;
        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let lineText = document.lineAt(lineNum).text;
        let insideWord = CursorMove._isWordCharCode(lineText.charCodeAt(colNum));
        colNum += 1;

        let found = false;
        while (!found) {
            const lineLen = lineText.length;
            for (let idx = colNum; idx < lineLen; idx += 1) {
                if (insideWord) {
                    if (!CursorMove._isWordCharCode(lineText.charCodeAt(idx))) {
                        insideWord = false;
                    }
                }
                else if (CursorMove._isWordCharCode(lineText.charCodeAt(idx))) {
                    found = true;
                    colNum = idx;
                    break;
                }
            }
            if (!found) {
                if (lineNum === lastLineNum) {
                    return undefined;
                }
                colNum = 0;
                lineNum += 1;
                insideWord = false;
                lineText = document.lineAt(lineNum).text;
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private static _expressionPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {  // TODO
        return undefined;
    }

    private static _expressionPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {  // TODO

        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let lineText = document.lineAt(lineNum).text;
        if (MatchingPair.isOpenerCharCode(lineText.charCodeAt(colNum)) || MatchingPair.isQuotesCharCode(lineText.charCodeAt(colNum))) {
            const newPosition = MatchingPair.matchPositionRight(document, startPosition);
            if (newPosition === undefined) {
                return undefined;
            }
            return (new vscode.Position(newPosition.line, newPosition.character + 1));
        }

        const lastLineNum = document.lineCount - 1;
        let insideWord = CursorMove._isWordCharCode(lineText.charCodeAt(colNum));

        let found = false;
        while (!found) {
            const lineLen = lineText.length;
            for (let idx = colNum; idx < lineLen; idx += 1) {
                const charCode = lineText.charCodeAt(idx);
                if (insideWord) {
                    if (!CursorMove._isWordCharCode(charCode)) {
                        found = true;
                        colNum = idx;
                        break;
                    }
                }
                else if (CursorMove._isWordCharCode(charCode)
                    || MatchingPair.isQuotesCharCode(charCode)
                    || MatchingPair.isOpenerCharCode(charCode)) {
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

    private static _isWordCharCode(charCode: number): boolean {
        return (
            (charCode >= 97 && charCode <= 122)    // a-z
            || (charCode >= 65 && charCode <= 90)  // A-Z
            || (charCode >= 48 && charCode <= 57)  // 0-9
            || (charCode === 95)                   // _
        );
    }
}
