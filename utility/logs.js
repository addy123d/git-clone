function createLogs(message, time) {
    const obj = {
        message: message,
        timeStamp: time
    }

    return obj;
}

module.exports = createLogs;