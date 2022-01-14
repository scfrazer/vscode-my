import * as vscode from 'vscode';

import { Language } from './language';

interface MatchPositionArgs {
    document: vscode.TextDocument;
    startPosition: vscode.Position;
    lookingForQuotes: boolean;
    goingRight: boolean;
    goingUp: boolean;
}

export class MatchingPair {

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
        return new vscode.Range(new vscode.Position(leftPosition.line, leftPosition.character + 1), rightPosition);
    }

    public static insideQuotesRange(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Range | undefined {
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
        return new vscode.Range(new vscode.Position(leftPosition.line, leftPosition.character + 1), rightPosition);
    }

    private static _matchPosition(args: MatchPositionArgs): vscode.Position | undefined {

        const language = new Language(args.document.languageId);
        const lastLineNum = (args.goingRight) ? args.document.lineCount - 1 : 0;
        const pairRe = new RegExp(language.getDelimiterReString(), 'g');

        // Iterate over lines looking for quotes/openers/closers
        let lineNum = args.startPosition.line;
        let colNum = 0;
        let firstIteration = true;
        let insideQuotes = false;
        let currentQuoteStr = '';
        let insideBlockComment = false;
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Get matches and remove irrelevant ones
            const lineText = args.document.lineAt(lineNum).text;
            const unfilteredMatches = lineText.matchAll(pairRe);
            let matches: Array<RegExpMatchArray> = [];
            for (const match of unfilteredMatches) {
                if (match?.index === undefined) {
                    continue;
                }
                if (!insideBlockComment) {
                    if (match[0] === language.lineCommentStart) {
                        break;
                    }
                }
                else {
                    // TODO Handle block comments
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

                if (insideQuotes) {
                    if (matchStr === currentQuoteStr) {
                        if (MatchingPair._charIsEscaped(colNum, lineText)) {
                            continue;
                        }
                        insideQuotes = false;
                        stackDepth -= 1;
                        found = (stackDepth === ((args.goingUp) ? -1 : 0));
                        if (found) {
                            break;
                        }
                    }
                    continue;
                }

                if (language.isQuotes(matchStr.charCodeAt(0))) {
                    if (!args.goingUp || stackDepth > 0) {
                        insideQuotes = true;
                        currentQuoteStr = matchStr;
                        stackDepth += 1;
                        continue;
                    }
                    else {
                        found = true;
                        break;
                    }
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
                }

                if (language.isCloser(matchStr.charCodeAt(0))) {
                    if (args.goingRight) {
                        stackDepth -= 1;
                        found = (stackDepth === ((args.goingUp) ? -1 : 0));
                        if (found) {
                            break;
                        }
                    }
                    else {
                        stackDepth += 1;
                        continue;
                    }
                }
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
