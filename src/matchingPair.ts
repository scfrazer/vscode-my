import * as vscode from 'vscode';

import { Language } from './language';

interface IMatchPositionArgs {
    document: vscode.TextDocument;
    startPosition: vscode.Position;
    lookingForQuotes: boolean;
    goingRight: boolean;
    goingUp: boolean;
}

export class MatchingPair {

    public static async selectInsideBrackets() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            const newRange = MatchingPair.insideBracketsRange(document, selection.active);
            if (newRange === undefined) {
                return selection;
            }
            return (new vscode.Selection(newRange.start, newRange.end));
        });
    }

    public static async selectInsideQuotes() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            const newRange = MatchingPair._insideQuotesRange(document, selection.active);
            if (newRange === undefined) {
                return selection;
            }
            return (new vscode.Selection(newRange.start, newRange.end));
        });
    }

    public static async selectInsideAny() {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        editor.selections = editor.selections.map((selection) => {
            let newRange;
            if (this._isInsideSingleLineString(document, selection.active)) {
                newRange = MatchingPair._insideQuotesRange(document, selection.active);
                if (newRange === undefined) {
                    return selection;
                }
                return (new vscode.Selection(newRange.start, newRange.end));
            }
            newRange = MatchingPair.insideBracketsRange(document, selection.active);
            if (newRange === undefined) {
                return selection;
            }
            return (new vscode.Selection(newRange.start, newRange.end));
        });
    }

    private static _isInsideSingleLineString(document: vscode.TextDocument, startPosition: vscode.Position): boolean {
        const lineText = document.lineAt(startPosition).text.substring(0, startPosition.character);
        const language = new Language(document.languageId);
        const quoteStr = language.getQuoteString();
        const searchRe = new RegExp(`^${quoteStr}|[^\\\\]${quoteStr}`, 'g');
        const quoteCount = (lineText.match(searchRe) || []).length;
        return (quoteCount % 2 === 1);
    }


    public static matchPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        if (startPosition.character === 0) {
            return undefined;
        }
        const language = new Language(document.languageId);
        const lineText = document.lineAt(startPosition.line).text;
        const lookingForQuotes = language.isQuotes(lineText.charCodeAt(startPosition.character - 1));
        return MatchingPair._matchPosition({
            document: document,
            startPosition: startPosition,
            lookingForQuotes: lookingForQuotes,
            goingRight: false,
            goingUp: false
        });
    }

    public static matchPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        const language = new Language(document.languageId);
        const lineText = document.lineAt(startPosition.line).text;
        const lookingForQuotes = language.isQuotes(lineText.charCodeAt(startPosition.character));
        return MatchingPair._matchPosition({
            document: document,
            startPosition: startPosition,
            lookingForQuotes: lookingForQuotes,
            goingRight: true,
            goingUp: false
        });
    }

    private static _matchPosition(args: IMatchPositionArgs): vscode.Position | undefined {

        const language = new Language(args.document.languageId);
        const lastLineNum = (args.goingRight) ? args.document.lineCount - 1 : 0;
        const searchRe = new RegExp((args.lookingForQuotes ? language.getQuoteString() : language.getBracketString()), 'g');

        let lineNum = args.startPosition.line;
        let colNum = 0;
        let firstIteration = true;
        let currentQuoteStr = '';
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Get matches and remove irrelevant ones
            const lineText = args.document.lineAt(lineNum).text;
            const unfilteredMatches = lineText.matchAll(searchRe);
            let matches: Array<RegExpMatchArray> = [];
            for (const match of unfilteredMatches) {
                if (match?.index === undefined) {
                    continue;
                }
                if (firstIteration) {
                    if (args.goingRight) {
                        if (match.index < args.startPosition.character) {
                            continue;
                        }
                    }
                    else if (match.index > args.startPosition.character - 1) {
                        continue;
                    }
                }
                matches.push(match);
            }
            if (!args.goingUp && matches.length === 0 && firstIteration) {
                return undefined;
            }
            if (!args.goingRight) {
                matches = matches.reverse();
            }
            firstIteration = false;

            // Iterate over matches
            for (const match of matches) {

                if (match?.index === undefined) {
                    continue;
                }
                colNum = match.index;
                const matchStr = match[0];
                if (MatchingPair._charIsEscaped(colNum, lineText)) {
                    continue;
                }

                if (args.lookingForQuotes) {
                    if (stackDepth === 0) {
                        if (args.goingUp) {
                            found = true;
                            break;
                        }
                        currentQuoteStr = matchStr;
                        stackDepth = 1;
                        continue;
                    }
                    if (matchStr !== currentQuoteStr) {
                        continue;
                    }
                    found = true;
                    break;
                }

                if (language.isOpener(matchStr.charCodeAt(0))) {
                    if (args.goingRight) {
                        stackDepth += 1;
                        continue;
                    }
                    else {
                        stackDepth -= 1;
                        found = (stackDepth === ((args.goingUp) ? -1 : 0));
                        if (found) {
                            break;
                        }
                    }
                    continue;
                }

                if (args.goingRight) {
                    stackDepth -= 1;
                    found = (stackDepth === ((args.goingUp) ? -1 : 0));
                    if (found) {
                        break;
                    }
                    continue;
                }
                stackDepth += 1;
            }

            if (found || (lineNum === lastLineNum)) {
                break;
            }
            lineNum += (args.goingRight) ? 1 : -1;
        }

        if (found) {
            return new vscode.Position(lineNum, colNum);
        }
        return undefined;
    }

    public static insideBracketsRange(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Range | undefined {
        const leftPosition = MatchingPair._matchPosition({
            document: document,
            startPosition: startPosition,
            lookingForQuotes: false,
            goingRight: false,
            goingUp: true
        });
        if (leftPosition === undefined) {
            return undefined;
        }
        const rightPosition = MatchingPair.matchPositionRight(document, leftPosition);
        if (rightPosition === undefined) {
            return undefined;
        }
        return new vscode.Range(leftPosition.translate(0, 1), rightPosition);
    }

    private static _insideQuotesRange(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Range | undefined {
        const leftPosition = MatchingPair._matchPosition({
            document: document,
            startPosition: startPosition,
            lookingForQuotes: true,
            goingRight: false,
            goingUp: true
        });
        if (leftPosition === undefined) {
            return undefined;
        }
        const rightPosition = MatchingPair.matchPositionRight(document, leftPosition);
        if (rightPosition === undefined) {
            return undefined;
        }
        return new vscode.Range(leftPosition.translate(0, 1), rightPosition);
    }

    private static _charIsEscaped(startingCol: number, str: string): boolean {
        let numBackslashes = 0;
        for (let pos = startingCol - 1; pos >= 0; pos -= 1) {
            if (str[pos] === '\\') {
                numBackslashes += 1;
                continue;
            }
            break;
        }
        return (numBackslashes % 2 === 1);
    }
}
