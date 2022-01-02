import * as vscode from 'vscode';

import { CursorMove } from './cursorMove';
import { Misc } from './misc';

export function activate(context: vscode.ExtensionContext) {

	function registerMyCommand(commandId: string, run: (...args: any[]) => void): void {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-my.' + commandId, run));
	}

	const cursorMove = new CursorMove();
	const misc = new Misc();

	registerMyCommand('wordRight', function (_args) { cursorMove.wordRight(); });
	registerMyCommand('selectExpressionLeft', function (_args) { cursorMove.selectExpressionLeft(); });
	registerMyCommand('selectExpressionRight', function (_args) { cursorMove.selectExpressionRight(); });
	registerMyCommand('deleteExpressionLeft', function (_args) { cursorMove.deleteExpressionLeft(); });
	registerMyCommand('deleteExpressionRight', function (_args) { cursorMove.deleteExpressionRight(); });
	registerMyCommand('previousParagraph', function (args) { cursorMove.previousParagraph(args); });
	registerMyCommand('nextParagraph', function (args) { cursorMove.nextParagraph(args); });
	registerMyCommand('addCursorsToLineStarts', function (_args) { misc.addCursorsToLineStarts(); });
}

export function deactivate() { }
