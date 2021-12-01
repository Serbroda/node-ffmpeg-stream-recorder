import { FFprobeProcess } from './services/FFprobeProcess';
import * as fs from 'fs';
import * as path from 'path';
import { Video } from './services/Video';

(async () => {
    const video = path.join(process.cwd(), 'andrea_duque97-21-10-30 232751.mp4');

    if (!fs.existsSync(video)) {
        throw new Error(`File ${video} not found`);
    }

    console.log(`Video duration is ${await new Video().getDuration(video)} seconds`);
    await new Video().createThumbnail(video);
})();
