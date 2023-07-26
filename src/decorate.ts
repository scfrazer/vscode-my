import * as vscode from 'vscode';

export class Decorate {

    private static _timeout: NodeJS.Timer | undefined = undefined;
    private static _activeEditor: vscode.TextEditor | undefined = undefined;
    private static _decorationDelay: number = 200;

    private static _fixmeDecorationType = vscode.window.createTextEditorDecorationType({
        color: "white",
        backgroundColor: "#af0000",
        borderRadius: "2px",
        overviewRulerLane: vscode.OverviewRulerLane.Center,
        overviewRulerColor: "#af0000"
    });

    private static _todoDecorationType = vscode.window.createTextEditorDecorationType({
        color: "black",
        backgroundColor: "#eeee00",
        borderRadius: "2px",
        overviewRulerLane: vscode.OverviewRulerLane.Center,
        overviewRulerColor: "#eeee00"
    });

    private static _noteDecorationType = vscode.window.createTextEditorDecorationType({
        color: "white",
        backgroundColor: "#27408b",
        borderRadius: "2px",
        overviewRulerLane: vscode.OverviewRulerLane.Center,
        overviewRulerColor: "#27408b"
    });

    private static _debugDecorationType = vscode.window.createTextEditorDecorationType({
        color: "black",
        backgroundColor: "#ffa500",
        borderRadius: "2px",
        overviewRulerLane: vscode.OverviewRulerLane.Center,
        overviewRulerColor: "#ffa500"
    });

    public static subscribeToChanges(context: vscode.ExtensionContext): void {

        Decorate._activeEditor = vscode.window.activeTextEditor;

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                Decorate._activeEditor = editor;
                if (editor) {
                    Decorate._triggerUpdate();
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (Decorate._activeEditor && event.document === Decorate._activeEditor.document) {
                    Decorate._triggerUpdate(true);
                }
            })
        );

        if (Decorate._activeEditor) {
            Decorate._triggerUpdate();
        }
    }

    public static setDecorationDelay() {
        const delay = vscode.workspace.getConfiguration().get<number>('todoDecorationDelay');
        if (delay) {
            Decorate._decorationDelay = delay;
        }
    }

    private static _triggerUpdate(throttle: boolean = false): void {
        if (Decorate._timeout) {
            clearTimeout(Decorate._timeout);
            Decorate._timeout = undefined;
        }
        if (throttle) {
            Decorate._timeout = setTimeout(Decorate._update, Decorate._decorationDelay);
        }
        else {
            Decorate._update();
        }
    }

    private static _update(): void {

        if (!Decorate._activeEditor) {
            return;
        }

        const document = Decorate._activeEditor.document;
        const text = document.getText();

        const regEx = /\b(FIXME|TODO|NOTE|DEBUG)\b/g;
        const fixmes: vscode.DecorationOptions[] = [];
        const todos: vscode.DecorationOptions[] = [];
        const notes: vscode.DecorationOptions[] = [];
        const debugs: vscode.DecorationOptions[] = [];
        let match: RegExpExecArray | null;
        while ((match = regEx.exec(text))) {
            const startPosition = document.positionAt(match.index);
            const endPosition = document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPosition, endPosition) };
            if (match[0] === "FIXME") {
                fixmes.push(decoration);
            }
            else if (match[0] === "TODO") {
                todos.push(decoration);
            }
            else if (match[0] === "NOTE") {
                notes.push(decoration);
            }
            else if (match[0] === "DEBUG") {
                debugs.push(decoration);
            }
        }

        Decorate._activeEditor.setDecorations(Decorate._fixmeDecorationType, fixmes);
        Decorate._activeEditor.setDecorations(Decorate._todoDecorationType, todos);
        Decorate._activeEditor.setDecorations(Decorate._noteDecorationType, notes);
        Decorate._activeEditor.setDecorations(Decorate._debugDecorationType, debugs);
    }
}
