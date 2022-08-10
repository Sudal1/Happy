module.exports = {
    now: () => {
        return new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().replace(/T/gi, " ").replace(/\..+/gi, '').slice(0, -3)
    },
}