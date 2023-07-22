import * as vscode from 'vscode';

export class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {

        const automaticallyTriggered: boolean = (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic);
        const results: Array<vscode.InlineCompletionItem> = [];
        const previousCompletions = new Map<string, boolean>;
        const numLinesToSearch = 1000;

        let searchRe;
        let range: vscode.Range;

        let prefix = _wordBeforePosition(document, position);
        let suffix = _wordAfterPosition(document, position);
        if (prefix === undefined && suffix === undefined) {
            return;
        }
        if (prefix === undefined) {
            prefix = "";
        }
        if (suffix === undefined) {
            suffix = "";
        }
        else if (automaticallyTriggered) {
            return;
        }

        searchRe = new RegExp(`\\b(${prefix}[a-zA-Z0-9_]*)${suffix}\\b`, 'g');
        const prefixLength = prefix.length;
        range = new vscode.Range(position.translate(0, -1 * prefixLength), position);

        let lineNum = position.line;
        let colNum = position.character - 1;
        if (colNum < 0) {
            colNum = 0;
        }
        let targetLineNum = (numLinesToSearch >= (lineNum + 1)) ? 0 : (lineNum - numLinesToSearch + 1);
        while (lineNum > targetLineNum) {
            let text = document.lineAt(lineNum).text;
            if (colNum > 0) {
                text = text.substring(0, colNum);
            }
            const matches = [...text.matchAll(searchRe)].reverse();
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[1];
                if (candidate.length === prefixLength) {
                    if (automaticallyTriggered) {
                        return;
                    }
                    continue;
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
        colNum = position.character + 1;
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
                if (candidate.length === prefixLength) {
                    if (automaticallyTriggered) {
                        return;
                    }
                    continue;
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
