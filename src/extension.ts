import * as vscode from "vscode";

import { CursorMove } from "./cursorMove";
import { Decorate } from "./decorate";
import { Edit } from "./edit";
import { EditorNavigation } from "./editorNavigation";
import { InlineCompletionItemProvider } from "./completionProvider";
import { MatchingPair } from "./matchingPair";
import { Misc } from "./misc";
import { OpenFile } from "./openFile";
import { SmartDelete } from "./smartDelete";
import { StatusBar } from "./statusBar";
import { ToChar } from "./toChar";

export function activate(context: vscode.ExtensionContext) {
    function registerMyCommand(command: string, callback: (...args: any[]) => void): void {
        context.subscriptions.push(vscode.commands.registerCommand("vscode-my." + command, callback));
    }

    registerMyCommand("wordLeft", function (_args) {
        CursorMove.wordLeft();
    });
    registerMyCommand("wordRight", function (_args) {
        CursorMove.wordRight();
    });
    registerMyCommand("wordEdgeLeft", function (_args) {
        CursorMove.wordEdgeLeft();
    });
    registerMyCommand("wordEdgeRight", function (_args) {
        CursorMove.wordEdgeRight();
    });
    registerMyCommand("wordPartLeft", function (_args) {
        CursorMove.wordPartLeft();
    });
    registerMyCommand("wordPartRight", function (_args) {
        CursorMove.wordPartRight();
    });
    registerMyCommand("selectWordPartLeft", function (_args) {
        CursorMove.selectWordPartLeft();
    });
    registerMyCommand("selectWordPartRight", function (_args) {
        CursorMove.selectWordPartRight();
    });
    registerMyCommand("deleteWordPartLeft", function (_args) {
        CursorMove.deleteWordPartLeft();
    });
    registerMyCommand("deleteWordPartRight", function (_args) {
        CursorMove.deleteWordPartRight();
    });
    registerMyCommand("expressionLeft", function (_args) {
        CursorMove.expressionLeft();
    });
    registerMyCommand("expressionRight", function (_args) {
        CursorMove.expressionRight();
    });
    registerMyCommand("selectExpressionLeft", function (_args) {
        CursorMove.selectExpressionLeft();
    });
    registerMyCommand("selectExpressionRight", function (_args) {
        CursorMove.selectExpressionRight();
    });
    registerMyCommand("previousParagraph", function (args) {
        CursorMove.previousParagraph(args);
    });
    registerMyCommand("nextParagraph", function (args) {
        CursorMove.nextParagraph(args);
    });
    registerMyCommand("home", function (args) {
        CursorMove.home(args);
    });
    registerMyCommand("smartDeleteLeft", function (_args) {
        SmartDelete.deleteLeft();
    });
    registerMyCommand("smartDeleteRight", function (_args) {
        SmartDelete.deleteRight();
    });
    registerMyCommand("selectInsideQuotes", function (_args) {
        MatchingPair.selectInsideQuotes();
    });
    registerMyCommand("selectInsideBrackets", function (_args) {
        MatchingPair.selectInsideBrackets();
    });
    registerMyCommand("selectInsideQuotesOrBrackets", function (_args) {
        MatchingPair.selectInsideQuotesOrBrackets();
    });
    registerMyCommand("selectByIndentation", function (_args) {
        MatchingPair.selectByIndentation();
    });
    registerMyCommand("smartSelect", function (_args) {
        MatchingPair.smartSelect();
    });
    registerMyCommand("gotoChar", function (args) {
        ToChar.goto(args);
    });
    registerMyCommand("deleteToChar", function (_args) {
        ToChar.delete();
    });
    registerMyCommand("addCursorsToLineStarts", function (_args) {
        Misc.addCursorsToLineStarts();
    });
    registerMyCommand("addSemicolonToEndOfLine", function (_args) {
        Misc.addSemicolonToEndOfLine();
    });
    registerMyCommand("justOneSpace", function (_args) {
        Misc.justOneSpace();
    });
    registerMyCommand("deletePairRight", function (_args) {
        Misc.deletePairRight();
    });
    registerMyCommand("gotoLine", function (_args) {
        Misc.gotoLine();
    });
    registerMyCommand("smartTab", function (_args) {
        Misc.smartTab();
    });
    registerMyCommand("findInCurrentFile", function (_args) {
        Misc.findInCurrentFile();
    });
    registerMyCommand("centerCursorLine", function (_args) {
        Misc.centerCursorLine();
    });
    registerMyCommand("googleSelection", function (_args) {
        Misc.googleSelection();
    });
    registerMyCommand("oneArgumentPerLine", function (_args) {
        Misc.oneArgumentPerLine();
    });
    registerMyCommand("gotoFirstMatch", function (_args) {
        Misc.gotoFirstMatch();
    });
    registerMyCommand("gotoLastMatch", function (_args) {
        Misc.gotoLastMatch();
    });
    registerMyCommand("openAlternativeFile", function (_args) {
        Misc.openAlternativeFile();
    });
    registerMyCommand("highlightedCopy", function (_args) {
        Edit.copy();
    });
    registerMyCommand("reselectablePaste", function (_args) {
        Edit.paste();
    });
    registerMyCommand("reselectPreviousPaste", function (_args) {
        Edit.previousPaste();
    });
    registerMyCommand("pasteSelectedAtLastEditLocation", function (_args) {
        Edit.pasteSelectedAtLastEditLocation();
    });
    registerMyCommand("swapSelectionAndClipboard", function (_args) {
        Edit.swapSelectionAndClipboard();
    });
    registerMyCommand("previousChange", function (_args) {
        EditorNavigation.previousChange();
    });
    registerMyCommand("nextChange", function (_args) {
        EditorNavigation.nextChange();
    });
    registerMyCommand("previousProblem", function (_args) {
        EditorNavigation.previousProblem();
    });
    registerMyCommand("nextProblem", function (_args) {
        EditorNavigation.nextProblem();
    });
    registerMyCommand("openFileUnderCursor", function (_args) {
        OpenFile.underCursor();
    });

    StatusBar.subscribeToChanges(context);
    Decorate.subscribeToChanges(context);

    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            { pattern: "**/*.{txt,md,sh,ts,js,py,sv,svh,c,h,cpp,hpp,cc,hh}" },
            new InlineCompletionItemProvider()
        )
    );

    setKeybindingsEnabled();
    Decorate.setDecorationDelay();

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("my.enableKeybindings")) {
            setKeybindingsEnabled();
        }
        if (event.affectsConfiguration("my.todoDecorationDelay")) {
            // TODO Get colors from config
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
    const enabled = vscode.workspace.getConfiguration().get("my.enableKeybindings");
    vscode.commands.executeCommand("setContext", "myKeybindingsEnabled", enabled);
}

export function deactivate() {}
