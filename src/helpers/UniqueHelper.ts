export const createUnique = (date: Date = new Date()) => {
    const year = date.getFullYear().toString().substr(-2);
    const month = padStartNumber(date.getMonth(), 2, '0');
    const day = padStartNumber(date.getDate(), 2, '0');
    const hours = padStartNumber(date.getHours(), 2, '0');
    const minutes = padStartNumber(date.getMinutes(), 2, '0');
    const seconds = padStartNumber(date.getSeconds(), 2, '0');
    const milliseconds = padStartNumber(date.getMilliseconds(), 3, '0');
    const random = generateRandomNumber({ min: 1, max: 9 });
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
};

export const createIsoDate = (date: Date = new Date()) => {
    const year = date.getFullYear().toString().substr(-2);
    const month = padStartNumber(date.getMonth(), 2, '0');
    const day = padStartNumber(date.getDate(), 2, '0');
    return `${year}-${month}-${day}`;
};

export const createIsoDateTime = (date: Date = new Date()) => {
    const year = date.getFullYear().toString().substr(-2);
    const month = padStartNumber(date.getMonth(), 2, '0');
    const day = padStartNumber(date.getDate(), 2, '0');
    const hours = padStartNumber(date.getHours(), 2, '0');
    const minutes = padStartNumber(date.getMinutes(), 2, '0');
    const seconds = padStartNumber(date.getSeconds(), 2, '0');
    return `${year}-${month}-${day} ${hours}${minutes}${seconds}`;
};

export const padStartNumber = (value: number, length: number, char?: string): string => {
    return value.toString().padStart(length, char);
};

export const generateRandomNumber = (opt?: { min?: number; max?: number }) => {
    const min = opt?.min ? opt?.min : 0;
    const max = opt?.max ? opt?.max : 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const createUniqueV2 = (): string => {
    return (Date.now() + Math.round(Math.random() * 36 ** 12)).toString(36);
};
