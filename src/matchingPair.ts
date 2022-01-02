import * as vscode from 'vscode';

import { Language } from './language';

export class MatchingPair {

    public static quotes: Array<string> = ['\'', '"'];
    public static openers: Array<string> = ['[', '(', '{'];
    public static closers: Array<string> = [']', ')', '}'];

    public static matchPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return MatchingPair.matchPosition(document, startPosition, false);
    }

    public static matchPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return MatchingPair.matchPosition(document, startPosition, true);
    }

    public static matchPosition(document: vscode.TextDocument, startPosition: vscode.Position, goingRight: boolean): vscode.Position | undefined {

        const lastLineNum = (goingRight) ? document.lineCount - 1 : 0;
        const commentDelimiters = Language.getCommentDelimiters(document.languageId);
        const pairRe = MatchingPair._getPairRe(document.languageId);

        // Iterate over lines looking for quotes/openers/closers
        let lineNum = startPosition.line;
        let colNum = 0;
        let firstIteration = true;
        let insideQuotes = false;
        let currentQuoteChar = '';
        let insideBlockComment = false;
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Get matches and remove irrelevant ones
            const str = document.lineAt(lineNum).text;
            const unfilteredMatches = str.matchAll(pairRe);
            let matches: Array<RegExpMatchArray> = [];
            for (const match of unfilteredMatches) {
                if (match?.index === undefined) {
                    continue;
                }
                if (!insideBlockComment) {
                    if (commentDelimiters?.singleLine !== undefined && match[0] === commentDelimiters.singleLine) {
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
                    else if (match.index > startPosition.character) {
                        continue;
                    }
                }
                matches.push(match);
            }
            if (matches.length === 0) {
                if (firstIteration) {
                    return undefined;
                }
            }
            else if (!goingRight) {
                matches = matches.reverse();
            }
            firstIteration = false;

            // Iterate over matches
            for (const match of matches) {

                if (match?.index === undefined) {
                    continue;
                }
                colNum = match.index;
                const char = match[0];

                if (insideQuotes) {
                    if (char === currentQuoteChar) {
                        if (MatchingPair._charIsEscaped(colNum, str)) {
                            continue;
                        }
                        insideQuotes = false;
                        stackDepth -= 1;
                        found = (stackDepth === 0);
                        if (found) {
                            break;
                        }
                    }
                    continue;
                }

                if (MatchingPair.quotes.includes(char)) {
                    insideQuotes = true;
                    currentQuoteChar = char;
                    stackDepth += 1;
                    continue;
                }

                if (MatchingPair.openers.includes(char)) {
                    if (goingRight) {
                        stackDepth += 1;
                        continue;
                    }
                    else {
                        stackDepth -= 1;
                        found = (stackDepth === 0);
                        if (found) {
                            break;
                        }
                    }
                }

                if (MatchingPair.closers.includes(char)) {
                    if (goingRight) {
                        stackDepth -= 1;
                        found = (stackDepth === 0);
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

    private static _getPairRe(languageId: string) {
        const commentDelimiters = Language.getCommentDelimiters(languageId);
        let pairReStr = '[\\[\\](){}\'"]';
        if (commentDelimiters?.singleLine !== undefined) {
            let str = MatchingPair._escapeRegExp(commentDelimiters.singleLine);
            pairReStr += `|${str}`;
        }
        if (commentDelimiters?.blockStart !== undefined && commentDelimiters?.blockEnd !== undefined) {
            let startStr = MatchingPair._escapeRegExp(commentDelimiters.blockStart);
            let endStr = MatchingPair._escapeRegExp(commentDelimiters.blockEnd);
            pairReStr += `|${startStr}|${endStr}`;
        }
        return new RegExp(pairReStr, 'g');
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

    private static _escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'); // $& means the whole matched string
    }
}
