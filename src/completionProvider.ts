import * as vscode from 'vscode';

export class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.InlineCompletionContext,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {

        const results: Array<vscode.InlineCompletionItem> = [];
        const previousCompletions = new Map<string, boolean>;

        const word = _wordBeforePosition(document, position);
        if (word === undefined) {
            return;
        }
        const wordRe = new RegExp('\\b' + word + '[a-zA-Z0-9_]+', 'g');

        let lineNum = position.line;
        let colNum = position.character;
        while (lineNum > 0) {
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
                if (previousCompletions.has(candidate)) {
                    continue;
                }
                previousCompletions.set(candidate, true);
                const completionItem = new vscode.InlineCompletionItem(candidate);
                results.push(completionItem);
            }
            lineNum -= 1;
            colNum = 0;
        }

        lineNum = position.line;
        colNum = position.character;
        const lastLineNum = document.lineCount;
        while (lineNum < lastLineNum) {
            const text = document.lineAt(lineNum).text.substring(colNum);
            const matches = text.matchAll(wordRe);
            for (const match of matches) {
                if (match?.index === undefined) {
                    continue;
                }
                const candidate = match[0];
                if (previousCompletions.has(candidate)) {
                    continue;
                }
                previousCompletions.set(candidate, true);
                const completionItem = new vscode.InlineCompletionItem(candidate);
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
