export interface CommentDelimiters {
    singleLine: string | undefined;
    blockStart: string | undefined;
    blockEnd: string | undefined;

};

export class Language {

    public static getCommentDelimiters(language: string): CommentDelimiters | undefined {
        switch (language) {

            case "c":
            case "cpp":
            case "javascript":
            case "jsonc":
            case "systemverilog":
            case "typescript":
            case "verilog":
                return ({ singleLine: "//", blockStart: "/*", blockEnd: "*/" });

            case "python":
            case "yaml":
                return ({ singleLine: "#", blockStart: undefined, blockEnd: undefined });

        }
        return undefined;
    }
}
