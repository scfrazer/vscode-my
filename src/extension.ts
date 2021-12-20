import * as vscode from 'vscode';

import { QuickEdit } from './quickEdit';

export function activate(context: vscode.ExtensionContext) {

	function registerMyCommand(commandId: string, run: (...args: any[]) => void): void {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-my.' + commandId, run));
	}

	const quickEdit = new QuickEdit();

	registerMyCommand('jumpToBracket', function (_args) { quickEdit.jumpToBracket(); });
	registerMyCommand('selectExpressionLeft', function (_args) { quickEdit.selectExpressionLeft(); });
	registerMyCommand('selectExpressionRight', function (_args) { quickEdit.selectExpressionRight(); });
	registerMyCommand('deleteExpressionLeft', function (_args) { quickEdit.deleteExpressionLeft(); });
	registerMyCommand('deleteExpressionRight', function (_args) { quickEdit.deleteExpressionRight(); });
	registerMyCommand('previousParagraph', function (args) { quickEdit.previousParagraph(args); });
	registerMyCommand('nextParagraph', function (args) { quickEdit.nextParagraph(args); });
	registerMyCommand('addCursorsToLineStarts', function (_args) { quickEdit.addCursorsToLineStarts(); });
}

export function deactivate() { }
