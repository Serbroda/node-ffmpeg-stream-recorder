import * as HLS from 'hls-parser';
import { types } from 'hls-parser';
import { configuration } from '../config';
import MediaPlaylist = types.MediaPlaylist;
import MasterPlaylist = types.MasterPlaylist;
import Variant = types.Variant;
import { ArrayIndexed } from '../models/IndexedVariant';

export class HLSParser {
    public static parseManifest(manifest: string): MasterPlaylist | MediaPlaylist {
        return HLS.parse(manifest);
    }

    public static async parseUrl(
        url: string,
        fetcher: (url: RequestInfo, init?: RequestInit) => Promise<Response> = configuration.fetcher
    ): Promise<MasterPlaylist | MediaPlaylist> {
        const response = await fetcher(url);
        if (response.status > 399) {
            throw new Error(`Failed to fetch data from url ${url}. Status ${response.status}`);
        }
        const manifest = await response.text();
        return HLSParser.parseManifest(manifest);
    }

    public static stringify(hls: MasterPlaylist | MediaPlaylist): string {
        return HLS.stringify(hls);
    }

    public static findVariant(
        master: MasterPlaylist,
        predicate: (this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean
    ): ArrayIndexed<Variant> | undefined {
        const index = master.variants.findIndex(predicate);
        if (index < 0) {
            return undefined;
        }
        return {
            variant: master.variants[index],
            index,
        };
    }

    public filterVariants(
        master: MasterPlaylist,
        predicate: (this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean
    ): ArrayIndexed<Variant>[] {
        return master.variants.filter(predicate).map((val: Variant, index: number) => {
            return { variant: val, index: index } as ArrayIndexed<Variant>;
        });
    }
}
