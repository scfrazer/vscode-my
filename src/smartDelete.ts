import * as vscode from 'vscode';

import { Language } from './language';
import { MatchingPair } from './matchingPair';
import { Util } from './util';

export class SmartDelete {

    public static async deleteLeft() {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;

        if (editor.selections.length === 1) {
            // At beginning of line, join with previous
            if (editor.selection.active.character === 0) {
                if (editor.selection.active.line === 0) {
                    return;
                }
                await vscode.commands.executeCommand<void>("cursorUp");
                await vscode.commands.executeCommand<void>("editor.action.joinLines");
                return;
            }
        }

        const language = new Language(document.languageId);

        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {


                const lineText = document.lineAt(selection.active.line).text;
                const leftText = lineText.substring(0, selection.active.character);
                const charCode = leftText.charCodeAt(leftText.length - 1);
                let newCol: number | undefined = undefined;
                let newPosition: vscode.Position | undefined = undefined;

                // Looking back at whitespace ...
                if (Util.isWhitespace(charCode)) {
                    let searchRe;
                    // At beginning of word, delete whitespace + word
                    if (!Util.isWhitespace(lineText.charCodeAt(selection.active.character))) {
                        searchRe = new RegExp('[a-zA-Z0-9_]*[ \\t]+$');
                    }
                    // In the middle of whitespace, delete whitespace
                    else {
                        searchRe = new RegExp('[ \\t]+$');
                    }
                    let match = leftText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character - match[0].length;
                    }
                }
                // Looking back at closer/quote, delete match
                else if (language.isCloser(charCode) || language.isQuotes(charCode)) {
                    const matchPosition = MatchingPair.matchPositionLeft(document, selection.active);
                    if (matchPosition !== undefined) {
                        newPosition = new vscode.Position(matchPosition.line, matchPosition.character);
                    }
                }
                // Looking back at word char, delete word
                else if (language.isWord(charCode)) {
                    const searchRe = new RegExp('[a-zA-Z0-9_]+$');
                    let match = leftText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character - match[0].length;
                    }
                }
                // Looking back at not-word char, delete not-word-or-opener-or-quote
                else {
                    const searchRe = new RegExp('[^a-zA-Z0-9_\\[\\](){}\'"]+$'); // TODO Get brackets/quote from language
                    let match = leftText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character - match[0].length;
                    }
                }

                if (newCol !== undefined) {
                    newPosition = new vscode.Position(selection.active.line, newCol);
                }
                if (newPosition !== undefined) {
                    const range = new vscode.Range(selection.anchor, newPosition);
                    editBuilder.delete(range);
                }
            });
        });
    }

    public static async deleteRight() {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;

        if (editor.selections.length === 1) {
            // At end of line, join with next
            const lineText = document.lineAt(editor.selection.active.line).text;
            if (editor.selection.active.character === lineText.length) {
                await vscode.commands.executeCommand<void>("editor.action.joinLines");
                return;
            }
        }

        const language = new Language(document.languageId);

        editor.edit((editBuilder) => {
            editor.selections.map((selection) => {

                const lineText = document.lineAt(selection.active.line).text;
                const rightText = lineText.substring(selection.active.character);
                const charCode = rightText.charCodeAt(0);
                let newCol: number | undefined = undefined;
                let newPosition: vscode.Position | undefined = undefined;

                // Looking at whitespace, delete whitespace
                if (Util.isWhitespace(charCode)) {
                    const searchRe = new RegExp('^[ \\t]+');
                    let match = rightText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character + match[0].length;
                    }
                }
                // Looking at opener/quote, delete match
                else if (language.isOpener(charCode) || language.isQuotes(charCode)) {
                    const matchPosition = MatchingPair.matchPositionRight(document, selection.active);
                    if (matchPosition !== undefined) {
                        newPosition = new vscode.Position(matchPosition.line, matchPosition.character + 1);
                    }
                }
                // Looking at word char ...
                else if (language.isWord(charCode)) {
                    let searchRe;
                    // At beginning of word, delete word + whitespace
                    if (selection.active.character === 0
                        || !language.isWord(lineText.charCodeAt(selection.active.character - 1))) {
                        searchRe = new RegExp('^[a-zA-Z0-9_]+[ \\t]*');
                    }
                    // In middle of word, delete to end of word
                    else {
                        searchRe = new RegExp('^[a-zA-Z0-9_]+');
                    }
                    let match = rightText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character + match[0].length;
                    }
                }
                // Looking at not-word char, delete not-word-or-opener-or-quote
                else {
                    const searchRe = new RegExp('^[^a-zA-Z0-9_\\[\\](){}\'"]+'); // TODO Get brackets/quote from language
                    let match = rightText.match(searchRe);
                    if (match !== null) {
                        newCol = selection.active.character + match[0].length;
                    }
                }

                if (newCol !== undefined) {
                    newPosition = new vscode.Position(selection.active.line, newCol);
                }
                if (newPosition !== undefined) {
                    const range = new vscode.Range(selection.anchor, newPosition);
                    editBuilder.delete(range);
                }
            });
        });
    }
}
