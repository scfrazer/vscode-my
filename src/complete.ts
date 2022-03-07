import * as vscode from 'vscode';

export class Complete {

    private static _fileName: string;
    private static _stem: string;
    private static _startPos: vscode.Position;
    private static _endPos: vscode.Position;
    private static _previousCompletions: Map<string, boolean>;
    private static _searchPos: vscode.Position;
    private static _searchingLeft: boolean;

    public static async currentWord() {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        if (editor.selections.length > 1) {
            return;
        }

        const document = editor.document;
        if (document.fileName !== Complete._fileName || !editor.selection.active.isEqual(Complete._endPos)) {
            const word = Complete._wordBeforePosition(document, editor.selection.active);
            if (word === undefined) {
                return;
            }
            Complete._fileName = document.fileName;
            Complete._stem = word;
            Complete._startPos = editor.selection.active.translate(0, -1 * word.length);
            Complete._endPos = editor.selection.active;
            Complete._previousCompletions = new Map<string, boolean>();
            Complete._searchPos = Complete._startPos;
            Complete._searchingLeft = true;
        }

        let completion: string | undefined = undefined;
        if (Complete._searchingLeft) {
            completion = Complete._searchLeft(document);
            if (completion === undefined) {
                Complete._searchPos = Complete._startPos;
                Complete._searchingLeft = false;
            }
        }
        if (!Complete._searchingLeft) {
            completion = Complete._searchRight(document);
            if (completion === undefined) {
                Complete._previousCompletions = new Map<string, boolean>();
                Complete._searchPos = Complete._startPos;
                Complete._searchingLeft = true;
                completion = Complete._stem;
            }
        }

        editor.edit((editBuilder) => {
            if (completion !== undefined) {
                const range = new vscode.Range(Complete._startPos, Complete._endPos);
                editBuilder.replace(range, completion);
            }
        }).then((success) => {
            if (!success) {
                return;
            }
            if (completion !== undefined) {
                Complete._endPos = Complete._startPos.translate(0, completion.length);
                editor.selection = new vscode.Selection(Complete._endPos, Complete._endPos);
            }
        });
    }

    private static _searchLeft(document: vscode.TextDocument): string | undefined {

        let completion: string | undefined = undefined;
        const wordRe = new RegExp(Complete._stem + '[a-zA-Z0-9_]+', 'g');

        let lineNum = Complete._searchPos.line;
        let colNum = Complete._searchPos.character;

        while (completion === undefined) {

            let text = document.lineAt(lineNum).text;
            if (colNum > 0) {
                text = text.substring(0, colNum);
            }

            const matches = [...text.matchAll(wordRe)].reverse();
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[0];
                if (Complete._previousCompletions.has(candidate)) {
                    continue;
                }
                Complete._searchPos = new vscode.Position(lineNum, match.index);
                Complete._previousCompletions.set(candidate, true);
                completion = candidate;
                break;
            }

            if (completion !== undefined) {
                break;
            }

            lineNum -= 1;
            if (lineNum < 0) {
                break;
            }
            colNum = 0;
        }

        return completion;
    }

    private static _searchRight(document: vscode.TextDocument): string | undefined {

        let completion: string | undefined = undefined;
        const wordRe = new RegExp(Complete._stem + '[a-zA-Z0-9_]+', 'g');

        let lineNum = Complete._searchPos.line;
        let colNum = Complete._searchPos.character;

        while (completion === undefined) {

            let text = document.lineAt(lineNum).text;
            if (colNum > 0) {
                text = text.substring(0, colNum);
            }

            const matches = [...text.matchAll(wordRe)].reverse();
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[0];
                if (Complete._previousCompletions.has(candidate)) {
                    continue;
                }
                Complete._searchPos = new vscode.Position(lineNum, match.index);
                Complete._previousCompletions.set(candidate, true);
                completion = candidate;
                break;
            }

            if (completion !== undefined) {
                break;
            }

            lineNum -= 1;
            if (lineNum < 0) {
                break;
            }
            colNum = 0;
        }

        return completion;
    }

    private static _wordBeforePosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {
        let word: string | undefined = undefined;
        let lineText = document.lineAt(position).text;
        const leftText = lineText.substring(0, position.character);
        let match = leftText.match(/([a-zA-Z0-9_]+)$/);
        if (match !== null) {
            word = match[1];
        }
        return word;
    }
}
