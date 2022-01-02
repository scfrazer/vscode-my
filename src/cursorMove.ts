import * as vscode from 'vscode';

import { MatchingPair } from './matchingPair';

export class CursorMove {

    private _matchingPair = new MatchingPair();

    public async wordLeft() { }  // TODO

    public async wordRight() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            const newPosition = this._wordPositionRight(document, selection.active);
            if (newPosition === undefined) {
                return selection;
            }
            return (new vscode.Selection(selection.isEmpty ? newPosition : selection.anchor, newPosition));
        });
    }

    public async expressionLeft() { }  // TODO

    public async expressionRight() { }  // TODO

    public async selectExpressionLeft() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const str = document.lineAt(startPosition.line).text;
        const char = str[startPosition.character - 1];
        if (this._matchingPair.quotes.includes(char) || this._matchingPair.closers.includes(char)) {
            const matchPosition = this._matchingPair.matchPositionLeft(document, startPosition);
            if (matchPosition !== undefined) {
                const newPosition = new vscode.Position(matchPosition.line, matchPosition.character);
                editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
                await vscode.commands.executeCommand<void>("revealLine", { lineNumber: matchPosition.line });
            }
        }
        else {
            await vscode.commands.executeCommand<void>("cursorWordLeftSelect");
        }
    }

    public async selectExpressionRight() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const str = document.lineAt(startPosition.line).text;
        const char = str[startPosition.character];
        if (this._matchingPair.quotes.includes(char) || this._matchingPair.openers.includes(char)) {
            const matchPosition = this._matchingPair.matchPositionRight(document, startPosition);
            if (matchPosition !== undefined) {
                const newPosition = new vscode.Position(matchPosition.line, matchPosition.character + 1);
                editor.selection = new vscode.Selection(editor.selection.anchor, newPosition);
                await vscode.commands.executeCommand<void>("revealLine", { lineNumber: matchPosition.line });
            }
        }
        else {
            await vscode.commands.executeCommand<void>("cursorWordStartRightSelect");
        }
    }

    public async deleteExpressionLeft() {
        // TODO: deleteExpressionLeft -- Ctrl+Backspace
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const str = document.lineAt(startPosition.line).text;
        const char = str[startPosition.character - 1];
        if (this._matchingPair.quotes.includes(char) || this._matchingPair.closers.includes(char)) {
            const matchPosition = this._matchingPair.matchPositionLeft(document, startPosition);
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

    public async deleteExpressionRight() {
        // TODO: deleteExpressionRight -- Ctrl+Delete
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const str = document.lineAt(startPosition.line).text;
        const char = str[startPosition.character];
        if (/\s/.test(char)) {
            await vscode.commands.executeCommand<void>("deleteWordStartRight");
        }
        else if (this._matchingPair.quotes.includes(char) || this._matchingPair.openers.includes(char)) {
            const matchPosition = this._matchingPair.matchPositionRight(document, startPosition);
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

    private _wordPositionLeft() { }  // TODO

    private _wordPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lastLineNum = document.lineCount - 1;
        let lineNum = startPosition.line;
        let colNum = startPosition.character;

        let line = document.lineAt(lineNum).text;
        let insideWord = this._isWordChar(line[colNum]);
        colNum += 1;

        let found = false;
        while (!found) {
            const lineLen = line.length;
            for (let idx = colNum; idx < lineLen; idx += 1) {
                if (insideWord) {
                    if (!this._isWordChar(line[idx])) {
                        insideWord = false;
                    }
                    continue;
                }
                else {
                    if (this._isWordChar(line[idx])) {
                        found = true;
                        colNum = idx;
                        break;
                    }
                }
            }
            if (!found) {
                if (lineNum === lastLineNum) {
                    return undefined;
                }
                colNum = 0;
                lineNum += 1;
                line = document.lineAt(lineNum).text;
            }
        }

        if (found) {
            return (new vscode.Position(lineNum, colNum));
        }
        return undefined;
    }

    private _expressionPositionLeft() { }  // TODO

    private _expressionPositionRight() { }  // TODO

    public async previousParagraph(args: any = {}) {
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

    public async nextParagraph(args: any = {}) {
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

    private _isWordChar(char: string): boolean {
        const charCode = char.charCodeAt(0);
        return (
            (charCode >= 97 && charCode <= 122)    // a-z
            || (charCode >= 65 && charCode <= 90)  // A-Z
            || (charCode >= 48 && charCode <= 57)  // 0-9
            || (charCode === 95)                   // _
        );
    }
}
