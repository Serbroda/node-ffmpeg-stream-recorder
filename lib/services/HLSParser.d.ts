import { types } from 'hls-parser';
import MediaPlaylist = types.MediaPlaylist;
import MasterPlaylist = types.MasterPlaylist;
import Variant = types.Variant;
import { ArrayIndexed } from '../models/ArrayIndexed';
import { VariantResolutionOption } from '../models';
export declare class HLSParser {
    static parseManifest(manifest: string): MasterPlaylist | MediaPlaylist;
    static parseUrl(url: string, fetcher?: (url: RequestInfo | any, init?: RequestInit | any) => Promise<Response | any>): Promise<MasterPlaylist | MediaPlaylist>;
    static stringify(hls: MasterPlaylist | MediaPlaylist): string;
    static mapIndexedVariants(variants: Variant[]): ArrayIndexed<Variant>[];
    static findVariant(master: MasterPlaylist, search: VariantResolutionOption): ArrayIndexed<Variant> | undefined;
    static findVariant(master: MasterPlaylist, predicate: (this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean): ArrayIndexed<Variant> | undefined;
    filterVariants(master: MasterPlaylist, predicate: (this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean): ArrayIndexed<Variant>[];
}
