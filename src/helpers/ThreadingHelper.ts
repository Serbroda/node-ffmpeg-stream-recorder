export const sleepAsync = (millis: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
};

export const sleep = (millis: number) => {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < millis);
};
