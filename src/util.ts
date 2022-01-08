export class Util {

    public static escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'); // $& means the whole matched string
    }
}
