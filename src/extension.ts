import * as vscode from 'vscode';

import { CursorMove } from './cursorMove';
import { SmartDelete } from './smartDelete';
import { MatchingPair } from './matchingPair';
import { ToChar } from './toChar';
import { Complete } from './complete';
import { Reselect } from './reselect';
import { StatusBar } from './statusBar';
import { Decorate } from './decorate';
import { Misc } from './misc';

export function activate(context: vscode.ExtensionContext) {

    function registerMyCommand(command: string, callback: (...args: any[]) => void): void {
        context.subscriptions.push(vscode.commands.registerCommand('vscode-my.' + command, callback));
    }

    registerMyCommand('wordLeft', function (_args) { CursorMove.wordLeft(); });
    registerMyCommand('wordRight', function (_args) { CursorMove.wordRight(); });
    registerMyCommand('wordPartLeft', function (_args) { CursorMove.wordPartLeft(); });
    registerMyCommand('wordPartRight', function (_args) { CursorMove.wordPartRight(); });
    registerMyCommand('deleteWordPartLeft', function (_args) { CursorMove.deleteWordPartLeft(); });
    registerMyCommand('deleteWordPartRight', function (_args) { CursorMove.deleteWordPartRight(); });
    registerMyCommand('expressionLeft', function (_args) { CursorMove.expressionLeft(); });
    registerMyCommand('expressionRight', function (_args) { CursorMove.expressionRight(); });
    registerMyCommand('selectExpressionLeft', function (_args) { CursorMove.selectExpressionLeft(); });
    registerMyCommand('selectExpressionRight', function (_args) { CursorMove.selectExpressionRight(); });
    registerMyCommand('previousParagraph', function (args) { CursorMove.previousParagraph(args); });
    registerMyCommand('nextParagraph', function (args) { CursorMove.nextParagraph(args); });
    registerMyCommand('home', function (args) { CursorMove.home(args); });
    registerMyCommand('smartDeleteLeft', function (_args) { SmartDelete.deleteLeft(); });
    registerMyCommand('smartDeleteRight', function (_args) { SmartDelete.deleteRight(); });
    registerMyCommand('selectInsideBrackets', function (_args) { MatchingPair.selectInsideBrackets(); });
    registerMyCommand('selectInsideQuotes', function (_args) { MatchingPair.selectInsideQuotes(); });
    registerMyCommand('selectInsideAny', function (_args) { MatchingPair.selectInsideAny(); });
    registerMyCommand('gotoChar', function (args) { ToChar.goto(args); });
    registerMyCommand('deleteToChar', function (_args) { ToChar.delete(); });
    registerMyCommand('completeCurrentWord', function (_args) { Complete.currentWord(); });
    registerMyCommand('completeKeepCompleting', function (_args) { Complete.keepCompleting(); });
    registerMyCommand('addCursorsToLineStarts', function (_args) { Misc.addCursorsToLineStarts(); });
    registerMyCommand('addSemicolonToEndOfLine', function (_args) { Misc.addSemicolonToEndOfLine(); });
    registerMyCommand('justOneSpace', function (_args) { Misc.justOneSpace(); });
    registerMyCommand('pasteSelectedAtLastEditLocation', function (_args) { Misc.pasteSelectedAtLastEditLocation(); });
    registerMyCommand('deletePairRight', function (_args) { Misc.deletePairRight(); });
    registerMyCommand('gotoLine', function (_args) { Misc.gotoLine(); });
    registerMyCommand('smartTab', function (_args) { Misc.smartTab(); });
    registerMyCommand('findInCurrentFile', function (_args) { Misc.findInCurrentFile(); });
    registerMyCommand('centerCursorLine', function (_args) { Misc.centerCursorLine(); });
    registerMyCommand('googleSelection', function (_args) { Misc.googleSelection(); });
    registerMyCommand('oneArgumentPerLine', function (_args) { Misc.oneArgumentPerLine(); });
    registerMyCommand('gotoFirstMatch', function (_args) { Misc.gotoFirstMatch(); });
    registerMyCommand('gotoLastMatch', function (_args) { Misc.gotoLastMatch(); });
    registerMyCommand('openAlternativeFile', function (_args) { Misc.openAlternativeFile(); });
    registerMyCommand('reselectablePaste', function (_args) { Reselect.paste(); });
    registerMyCommand('reselectPreviousPaste', function (_args) { Reselect.previousPaste(); });

    StatusBar.subscribeToChanges(context);
    Decorate.subscribeToChanges(context);

    setKeybindingsEnabled();
    Decorate.setDecorationDelay();

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('my.enableKeybindings')) {
            setKeybindingsEnabled();
        }
        if (event.affectsConfiguration('my.todoDecorationDelay')) {
            Decorate.setDecorationDelay();
        }
    });

    // Keep editors in MRU order
    // vscode.window.onDidChangeActiveTextEditor((e) => {
    // 	if (e === undefined) {
    // 		return;
    // 	}
    // 	vscode.commands.executeCommand('moveActiveEditor', { to: "first", by: "tab" });
    // });
}

function setKeybindingsEnabled() {
    const enabled = vscode.workspace.getConfiguration().get('my.enableKeybindings');
    vscode.commands.executeCommand('setContext', 'myKeybindingsEnabled', enabled);
}

export function deactivate() { }
