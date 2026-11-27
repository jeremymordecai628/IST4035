const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '../data');

function readData(fileName) {
    const filePath = path.join(dataDirectory, `${fileName}.json`);

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeData(fileName, data) {
    const filePath = path.join(dataDirectory, `${fileName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    readData,
    writeData
};