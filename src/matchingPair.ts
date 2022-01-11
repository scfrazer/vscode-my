import { start } from 'repl';
import * as vscode from 'vscode';

import { Language } from './language';

export class MatchingPair {

    public static matchPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return MatchingPair._matchPosition(document, startPosition, false, false);
    }

    public static matchPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return MatchingPair._matchPosition(document, startPosition, true, false);
    }

    public static insideRange(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Range | undefined {
        const leftPosition = MatchingPair._matchPosition(document, startPosition, false, true);
        if (leftPosition === undefined) {
            return undefined;
        }
        const rightPosition = MatchingPair.matchPositionRight(document, leftPosition);
        if (rightPosition === undefined) {
            return undefined;
        }
        return new vscode.Range(new vscode.Position(leftPosition.line, leftPosition.character + 1), rightPosition);
    }

    private static _matchPosition(document: vscode.TextDocument, startPosition: vscode.Position, goingRight: boolean, goingUp: boolean): vscode.Position | undefined {

        const language = new Language(document.languageId);
        const lastLineNum = (goingRight) ? document.lineCount - 1 : 0;
        const pairRe = new RegExp(language.getDelimiterReString(), 'g');

        // Iterate over lines looking for quotes/openers/closers
        let lineNum = startPosition.line;
        let colNum = 0;
        let firstIteration = true;
        let insideQuotes = false;
        let currentQuoteStr = '';
        let insideBlockComment = false;
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Get matches and remove irrelevant ones
            const lineText = document.lineAt(lineNum).text;
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
                    if (goingRight) {
                        if (match.index < startPosition.character) {
                            continue;
                        }
                    }
                    else if (match.index > startPosition.character - 1) {
                        continue;
                    }
                }
                matches.push(match);
            }
            if (!goingUp && matches.length === 0 && firstIteration) {
                return undefined;
            }
            if (!goingRight) {
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
                        found = (stackDepth === ((goingUp) ? -1 : 0));
                        if (found) {
                            break;
                        }
                    }
                    continue;
                }

                if (language.isQuotes(matchStr.charCodeAt(0))) {
                    if (!goingUp || stackDepth > 0) {
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
                    if (goingRight) {
                        stackDepth += 1;
                        continue;
                    }
                    else {
                        stackDepth -= 1;
                        found = (stackDepth === ((goingUp) ? -1 : 0));
                        if (found) {
                            break;
                        }
                    }
                }

                if (language.isCloser(matchStr.charCodeAt(0))) {
                    if (goingRight) {
                        stackDepth -= 1;
                        found = (stackDepth === ((goingUp) ? -1 : 0));
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
            lineNum += (goingRight) ? 1 : -1;
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
