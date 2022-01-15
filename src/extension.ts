import * as vscode from 'vscode';

import { CursorMove } from './cursorMove';
import { SmartDelete } from './smartDelete';
import { MatchingPair } from './matchingPair';
import { ToChar } from './toChar';
import { Misc } from './misc';

export function activate(context: vscode.ExtensionContext) {

	function registerMyCommand(command: string, callback: (...args: any[]) => void): void {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-my.' + command, callback));
	}

	registerMyCommand('wordLeft', function (_args) { CursorMove.wordLeft(); });
	registerMyCommand('wordRight', function (_args) { CursorMove.wordRight(); });
	registerMyCommand('expressionLeft', function (_args) { CursorMove.expressionLeft(); });
	registerMyCommand('expressionRight', function (_args) { CursorMove.expressionRight(); });
	registerMyCommand('selectExpressionLeft', function (_args) { CursorMove.selectExpressionLeft(); });
	registerMyCommand('selectExpressionRight', function (_args) { CursorMove.selectExpressionRight(); });
	registerMyCommand('deleteExpressionLeft', function (_args) { CursorMove.deleteExpressionLeft(); });
	registerMyCommand('deleteExpressionRight', function (_args) { CursorMove.deleteExpressionRight(); });
	registerMyCommand('selectInsideBrackets', function (_args) { MatchingPair.selectInsideBrackets(); });
	registerMyCommand('selectInsideQuotes', function (_args) { MatchingPair.selectInsideQuotes(); });
	registerMyCommand('selectToChar', function (_args) { ToChar.select(); });
	registerMyCommand('previousParagraph', function (args) { CursorMove.previousParagraph(args); });
	registerMyCommand('nextParagraph', function (args) { CursorMove.nextParagraph(args); });
	registerMyCommand('home', function (args) { CursorMove.home(args); });
	registerMyCommand('addCursorsToLineStarts', function (_args) { Misc.addCursorsToLineStarts(); });
	registerMyCommand('addSemicolonToEndOfLine', function (_args) { Misc.addSemicolonToEndOfLine(); });
}

export function deactivate() { }
