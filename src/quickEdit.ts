import * as vscode from 'vscode';

import { MatchingPair } from './matchingPair';

export class QuickEdit {

    private _matchingPair = new MatchingPair();

    public async jumpToBracket() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const startPosition = editor.selection.active;
        const str = document.lineAt(startPosition.line).text;
        const char = str[startPosition.character];
        let goForward = this._matchingPair.openers.includes(char);
        await vscode.commands.executeCommand<void>("editor.action.jumpToBracket");
        if (goForward) {
            await vscode.commands.executeCommand<void>("cursorMove", { to: "right" });
        }
    }

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

    public addCursorsToLineStarts() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let firstLine = editor.selection.start.line;
        let lastLine = editor.selection.end.line;
        let selections: Array<vscode.Selection> = [];
        for (let lineNum = firstLine; lineNum < lastLine; lineNum += 1) {
            let position = new vscode.Position(lineNum, 0);
            selections.push(new vscode.Selection(position, position));
        }
        editor.selections = selections;
    }
}
