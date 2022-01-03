export class CharCode {

    public static isWord(charCode: number): boolean {
        return (
            (charCode >= 97 && charCode <= 122)    // a-z
            || (charCode >= 65 && charCode <= 90)  // A-Z
            || (charCode >= 48 && charCode <= 57)  // 0-9
            || (charCode === 95)                   // _
        );
    }

    public static isOpener(charCode: number): boolean {
        return (
            (charCode === 40)      // Open paren
            || (charCode === 91)   // Open bracket
            || (charCode === 123)  // Open brace
        );
    }

    public static isCloser(charCode: number): boolean {
        return (
            (charCode === 41)      // Close paren
            || (charCode === 93)   // Close bracket
            || (charCode === 125)  // Close brace
        );
    }

    public static isQuotes(charCode: number): boolean {
        return (
            (charCode === 39)     // Single quote
            || (charCode === 34)  // Double quote
        );
    }

}
