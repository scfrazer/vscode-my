import * as vscode from 'vscode';

import { Language } from './language';

export class MatchingPair {

    public quotes: Array<string> = ['\'', '"'];
    public openers: Array<string> = ['[', '(', '{'];
    public closers: Array<string> = [']', ')', '}'];

    private _language = new Language();

    public matchPositionLeft(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const pairRe = new RegExp('[\\[\\](){}\'"]', 'g');

        // Iterate over lines looking for quotes/openers/closers
        let lineNum = startPosition.line;
        let colNum = 0;
        let scanningToStartPosition = true;
        let insideQuotes = false;
        let currentQuoteChar = '';
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Iterate backwards over matches
            const str = document.lineAt(lineNum).text;
            const matches = Array.from(str.matchAll(pairRe)).reverse();
            for (const match of matches) {

                // Skip anything after start position
                if (!match?.index) {
                    continue;
                }
                else if (scanningToStartPosition) {
                    scanningToStartPosition = (match.index > startPosition.character);
                    if (scanningToStartPosition) {
                        continue;
                    }
                }
                colNum = match.index;
                const char = match[0];

                // Currently inside quotes?
                if (insideQuotes) {
                    if (char === currentQuoteChar) {
                        let numBackslashes = 0;
                        for (let pos = colNum - 1; pos >= 0; pos -= 1) {
                            if (str[pos] === '\\') {
                                numBackslashes += 1;
                                continue;
                            }
                            break;
                        }
                        if (numBackslashes % 2 === 1) {
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

                // Start quotes?
                if (this.quotes.includes(char)) {
                    insideQuotes = true;
                    currentQuoteChar = char;
                    stackDepth += 1;
                    continue;
                }

                // Closer?
                if (this.closers.includes(char)) {
                    stackDepth += 1;
                    continue;
                }

                // Opener?
                if (this.openers.includes(char)) {
                    stackDepth -= 1;
                    found = (stackDepth === 0);
                    if (found) {
                        break;
                    }
                }
            }

            // Found it or at EOF
            if (found || (lineNum === 0)) {
                break;
            }

            // Go to previous line in file
            lineNum -= 1;
        }

        // Done
        if (found) {
            return new vscode.Position(lineNum, colNum);
        }
        return undefined;
    }

    public matchPositionRight(document: vscode.TextDocument, startPosition: vscode.Position): vscode.Position | undefined {

        const lastLineNum = document.lineCount - 1;
        const commentDelimiters = this._language.getCommentDelimiters(document.languageId);
        const pairRe = new RegExp('[\\[\\](){}\'"]', 'g');

        // Iterate over lines looking for quotes/openers/closers
        let lineNum = startPosition.line;
        let colNum = 0;
        let scanningToStartPosition = true;
        let insideQuotes = false;
        let currentQuoteChar = '';
        let stackDepth = 0;
        let found = false;
        while (!found) {

            // Iterate over matches
            const str = document.lineAt(lineNum).text;
            const matches = str.matchAll(pairRe);
            for (const match of matches) {

                // Skip anything before start position
                if (!match?.index) {
                    continue;
                }
                else if (scanningToStartPosition) {
                    scanningToStartPosition = (match.index < startPosition.character);
                    if (scanningToStartPosition) {
                        continue;
                    }
                }
                colNum = match.index;
                const char = match[0];

                // Currently inside quotes?
                if (insideQuotes) {
                    if (char === currentQuoteChar) {
                        let numBackslashes = 0;
                        for (let pos = colNum - 1; pos >= 0; pos -= 1) {
                            if (str[pos] === '\\') {
                                numBackslashes += 1;
                                continue;
                            }
                            break;
                        }
                        if (numBackslashes % 2 === 1) {
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

                // Start quotes?
                if (this.quotes.includes(char)) {
                    insideQuotes = true;
                    currentQuoteChar = char;
                    stackDepth += 1;
                    continue;
                }

                // Opener?
                if (this.openers.includes(char)) {
                    stackDepth += 1;
                    continue;
                }

                // Closer?
                if (this.closers.includes(char)) {
                    stackDepth -= 1;
                    found = (stackDepth === 0);
                    if (found) {
                        break;
                    }
                }
            }

            // Found it or at EOF
            if (found || (lineNum === lastLineNum)) {
                break;
            }

            // Go to next line in file
            lineNum += 1;
        }

        // Done
        if (found) {
            return new vscode.Position(lineNum, colNum);
        }
        return undefined;
    }
}
