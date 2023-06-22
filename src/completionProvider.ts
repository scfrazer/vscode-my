import * as vscode from 'vscode';

import { Util } from './util';

export class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.InlineCompletionContext,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {

        const results: Array<vscode.InlineCompletionItem> = [];
        const previousCompletions = new Map<string, boolean>;
        const numLinesToSearch = 1000;

        let searchRe;
        let path: string | undefined = "";
        let range: vscode.Range;

        let word = _wordBeforePosition(document, position);
        if (word !== undefined) {
            const restOfWord = _wordAfterPosition(document, position);
            if (restOfWord !== undefined) {
                searchRe = new RegExp(`\\b(${word}[a-zA-Z0-9_]*${restOfWord})`, 'g');
                range = new vscode.Range(position.translate(0, -1 * word.length), position.translate(0, restOfWord.length));
                word += restOfWord;
            }
            else {
                searchRe = new RegExp(`\\b(${word}[a-zA-Z0-9_]*)`, 'g');
                range = new vscode.Range(position.translate(0, -1 * word.length), position);
            }
        }
        else {
            path = _pathBeforePosition(document, position);
            if (path === undefined) {
                return;
            }
            searchRe = new RegExp('\\b(' + Util.escapeRegExp(path) + '[a-zA-Z0-9_]+)', 'g');
            range = new vscode.Range(position.translate(0, -1 * path.length), position);
        }

        let lineNum = position.line;
        let colNum = position.character;
        let targetLineNum = (numLinesToSearch >= (lineNum + 1)) ? 0 : (lineNum - numLinesToSearch + 1);
        while (lineNum > targetLineNum) {
            let text = document.lineAt(lineNum).text;
            if (colNum > 0) {
                text = text.substring(0, colNum - 1);
            }
            const matches = [...text.matchAll(searchRe)].reverse();
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[1];
                if (word !== undefined && (candidate.length === word.length)) {
                    return;
                }
                if (previousCompletions.has(candidate)) {
                    continue;
                }
                previousCompletions.set(candidate, true);
                const completionItem = new vscode.InlineCompletionItem(candidate, range);
                results.push(completionItem);
            }
            lineNum -= 1;
            colNum = 0;
        }

        lineNum = position.line;
        colNum = position.character;
        const lastLineNum = document.lineCount;
        targetLineNum = ((lineNum + numLinesToSearch) >= lastLineNum) ? lastLineNum : (lineNum + numLinesToSearch);
        while (lineNum < targetLineNum) {
            let text = document.lineAt(lineNum).text;
            if (colNum > 0) {
                text = text.substring(colNum);
            }
            const matches = text.matchAll(searchRe);
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[1];
                if (word !== undefined && (candidate.length === word.length)) {
                    return;
                }
                if (previousCompletions.has(candidate)) {
                    continue;
                }
                previousCompletions.set(candidate, true);
                const completionItem = new vscode.InlineCompletionItem(candidate, range);
                results.push(completionItem);
            }
            lineNum += 1;
            colNum = 0;
        }

        return results;
    }
}

function _wordBeforePosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {
    let word: string | undefined = undefined;
    const lineText = document.lineAt(position).text;
    const leftText = lineText.substring(0, position.character);
    const match = leftText.match(/([a-zA-Z0-9_]+)$/);
    if (match !== null) {
        word = match[1];
    }
    return word;
}

function _wordAfterPosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {
    let word: string | undefined = undefined;
    const lineText = document.lineAt(position).text;
    const rightText = lineText.substring(position.character);
    const match = rightText.match(/^([a-zA-Z0-9_]+)/);
    if (match !== null) {
        word = match[1];
    }
    return word;
}

function _pathBeforePosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {
    let path: string | undefined = undefined;
    const lineText = document.lineAt(position).text;
    const leftText = lineText.substring(0, position.character);
    const match = leftText.match(/([a-zA-Z0-9_.:\[\]]+[.\[])$/);
    if (match !== null) {
        path = match[1];
    }
    return path;
}
