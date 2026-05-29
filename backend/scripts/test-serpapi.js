"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
async function main() {
    const apiKey = '8d3d132e84d1124e8995f0b4993aa2c2123c544220675f23c2658fbe13e60735';
    const propertyToken = 'ChoIh77s167BpsTuARoNL2cvMTFodG1jZDViNxAB';
    try {
        const response = await axios_1.default.get('https://serpapi.com/search', {
            params: {
                engine: 'google_hotels',
                q: "Lien's Hotel",
                property_token: propertyToken,
                api_key: apiKey,
                hl: 'vi',
                gl: 'vn',
                currency: 'VND',
                check_in_date: '2026-06-15',
                check_out_date: '2026-06-16',
            },
        });
        console.log('Name:', response.data.name);
        console.log('Address:', response.data.address);
        console.log('GPS:', response.data.gps_coordinates);
        console.log('Amenities count:', response.data.amenities?.length);
    }
    catch (error) {
        console.error('Error occurred:', error.message);
    }
}
main();
//# sourceMappingURL=test-serpapi.js.map