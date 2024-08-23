export default class ExportMap extends Map<string, Set<string>> {
  hasOrCreate(key: string): Set<string> {
    const set = this.get(key) ?? new Set<string>();
    this.set(key, set);
    return set;
  }
}