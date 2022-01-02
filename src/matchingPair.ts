import * as vscode from 'vscode';

import { Language } from './language';

export class MatchingPair {

    public quotes: Array<string> = ['\'', '"'];
    public openers: Array<string> = ['[', '(', '{'];
    public closers: Array<string> = [']', ')', '}'];

    private _language = new Language();

    public matchPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return this.matchPosition(document, startPosition, false);
    }

    public matchPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {
        return this.matchPosition(document, startPosition, true);
    }

    public matchPosition(document: vscode.TextDocument, startPosition: vscode.Position, goingRight: boolean): vscode.Position | undefined {

        const lastLineNum = (goingRight) ? document.lineCount - 1 : 0;
        const commentDelimiters = this._language.getCommentDelimiters(document.languageId);
        const pairRe = this._getPairRe(document.languageId);

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
                        if (this._charIsEscaped(colNum, str)) {
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

                if (this.quotes.includes(char)) {
                    insideQuotes = true;
                    currentQuoteChar = char;
                    stackDepth += 1;
                    continue;
                }

                if (this.openers.includes(char)) {
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

                if (this.closers.includes(char)) {
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

    private _getPairRe(languageId: string) {
        const commentDelimiters = this._language.getCommentDelimiters(languageId);
        let pairReStr = '[\\[\\](){}\'"]';
        if (commentDelimiters?.singleLine !== undefined) {
            let str = this._escapeRegExp(commentDelimiters.singleLine);
            pairReStr += `|${str}`;
        }
        if (commentDelimiters?.blockStart !== undefined && commentDelimiters?.blockEnd !== undefined) {
            let startStr = this._escapeRegExp(commentDelimiters.blockStart);
            let endStr = this._escapeRegExp(commentDelimiters.blockEnd);
            pairReStr += `|${startStr}|${endStr}`;
        }
        return new RegExp(pairReStr, 'g');
    }

    private _charIsEscaped(startingCol: number, str: string): boolean {
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

    private _escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'); // $& means the whole matched string
    }
}
