import { Util } from './util';

export class Language {

    private _wordCharCodeRanges: Array<Array<number>>;
    private _openerCharCodes: Array<number>;
    private _closerCharCodes: Array<number>;
    private _quoteCharCodes: Array<number>;
    public lineCommentStart: string | undefined;
    public blockCommentStart: string | undefined;
    public blockCommentEnd: string | undefined;

    public constructor(language: string) {

        this._wordCharCodeRanges = [];
        this._wordCharCodeRanges.push([97, 122]); // a-z
        this._wordCharCodeRanges.push([65, 90]);  // A-Z
        this._wordCharCodeRanges.push([48, 57]);  // 0-9
        this._wordCharCodeRanges.push([95, 95]);  // underscore

        this._openerCharCodes = [40, 91, 123]; // Open paren/bracket/brace
        this._closerCharCodes = [41, 93, 125]; // Close paren/bracket/brace

        switch (language) {
            case "c":
            case "cpp":
            case "javascript":
            case "jsonc":
            case "systemverilog":
            case "typescript":
            case "verilog":
                this.lineCommentStart = "//";
                this.blockCommentStart = "/*";
                this.blockCommentEnd = "*/";
                break;

            case "python":
            case "shellscript":
            case "yaml":
                this.lineCommentStart = "#";
                break;
        }

        switch (language) {
            case "javascript":
            case "jsonc":
            case "markdown":
            case "python":
            case "shellscript":
            case "typescript":
            case "yaml":
                this._quoteCharCodes = [34, 39];  // Double/single quotes
                break;

            default:
                this._quoteCharCodes = [34];  // Double quotes
        }
    }

    public isWord(charCode: number): boolean {
        for (let charCodePair of this._wordCharCodeRanges) {
            if (charCode >= charCodePair[0] && charCode <= charCodePair[1]) {
                return true;
            }
        }
        return false;
    }

    public isOpener(charCode: number): boolean {
        return this._openerCharCodes.includes(charCode);
    }

    public isCloser(charCode: number): boolean {
        return this._closerCharCodes.includes(charCode);
    }

    public isQuotes(charCode: number): boolean {
        return this._quoteCharCodes.includes(charCode);
    }

    public getBracketString(): string {
        const allCharCodes = this._openerCharCodes.concat(this._closerCharCodes);
        const str = Util.escapeRegExp(String.fromCharCode(...allCharCodes));
        return `[${str}]`;
    }

    public getQuoteString(): string {
        const str = Util.escapeRegExp(String.fromCharCode(...this._quoteCharCodes));
        return `[${str}]`;
    }

    public getDelimiterReString(): string {

        const allCharCodes = this._openerCharCodes.concat(this._closerCharCodes).concat(this._quoteCharCodes);
        const charCodestr = Util.escapeRegExp(String.fromCharCode(...allCharCodes));

        let delimiterReStr = `[${charCodestr}]`;

        if (this.lineCommentStart !== undefined) {
            let str = Util.escapeRegExp(this.lineCommentStart);
            delimiterReStr += `|${str}`;
        }
        if (this.blockCommentStart !== undefined && this.blockCommentEnd !== undefined) {
            let startStr = Util.escapeRegExp(this.blockCommentStart);
            let endStr = Util.escapeRegExp(this.blockCommentEnd);
            delimiterReStr += `|${startStr}|${endStr}`;
        }

        return delimiterReStr;
    }

    public getEdgeReString(): string {

        const openers = Util.escapeRegExp(String.fromCharCode(...this._openerCharCodes));
        const closers = Util.escapeRegExp(String.fromCharCode(...this._closerCharCodes));
        const quotes = Util.escapeRegExp(String.fromCharCode(...this._quoteCharCodes));

        let delimiterReStr = `[a-zA-Z0-9_]+|[${openers}]+|[${closers}]+|[${quotes}]+`;

        if (this.lineCommentStart !== undefined) {
            let str = Util.escapeRegExp(this.lineCommentStart);
            delimiterReStr += `|${str}[^ ]*`;
        }
        if (this.blockCommentStart !== undefined && this.blockCommentEnd !== undefined) {
            let startStr = Util.escapeRegExp(this.blockCommentStart);
            let endStr = Util.escapeRegExp(this.blockCommentEnd);
            delimiterReStr += `|${startStr}[^ ]*|[^ ]*${endStr}`;
        }

        return delimiterReStr;
    }
}
