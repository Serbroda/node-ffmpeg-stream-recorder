import * as HLS from 'hls-parser';
import { types } from 'hls-parser';
import { configuration } from '../config';
import MediaPlaylist = types.MediaPlaylist;
import MasterPlaylist = types.MasterPlaylist;
import Variant = types.Variant;
import { ArrayIndexed } from '../models/IndexedVariant';
import { VariantOption, VariantResolutionOption } from '../models';
import { Resolution } from '../models/Resolution';

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
        search: VariantResolutionOption
    ): ArrayIndexed<Variant> | undefined;
    public static findVariant(
        master: MasterPlaylist,
        predicate: (this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean
    ): ArrayIndexed<Variant> | undefined;
    public static findVariant(
        master: MasterPlaylist,
        param:
            | VariantResolutionOption
            | ((this: void, value: Variant, index: number, obj: readonly Variant[]) => boolean)
    ): ArrayIndexed<Variant> | undefined {
        if (typeof param === 'function') {
            const index = master.variants.findIndex(param);
            if (index < 0) {
                return undefined;
            }
            return {
                variant: master.variants[index],
                index,
            };
        } else {
            let res: Resolution | undefined;
            if (typeof param.resolution === 'string') {
                if (/\dx\d/i.test(param.resolution)) {
                    const split = param.resolution.split(/x/i);
                    res = { width: parseInt(split[0]), height: parseInt(split[1]) };
                }
            } else {
                res = param.resolution;
            }
            if (res) {
                return HLSParser.findVariant(master, (v) => v.resolution === res);
            } else {
                return undefined;
            }
        }
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
