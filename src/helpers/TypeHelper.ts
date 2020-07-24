export const ofType = <T>(obj: any, instance: any): obj is T => {
    if (!obj) {
        return false;
    }
    return obj instanceof instance;
};
