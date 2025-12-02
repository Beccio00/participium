"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAddress = calculateAddress;
const axios_1 = __importDefault(require("axios"));
function calculateAddress(latitude, longitude) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=18&addressdetails=1`;
        const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
        try {
            const response = yield axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Partecipium-Report-App/1.0 (Contact: user@domain.com)'
                },
                validateStatus: (status) => status >= 200 && status < 500,
            });
            if (response.status === 200 && response.data.display_name) {
                const data = response.data;
                const address = data.address;
                let extractedAddress = '';
                if (address.road && address.house_number) {
                    extractedAddress = `${address.road}, ${address.house_number}`;
                }
                else if (address.road) {
                    extractedAddress = address.road;
                }
                else if (data.display_name) {
                    //if road is missing, use display_name but limit its length 
                    extractedAddress = data.display_name.split(',').slice(0, 3).join(', ').trim();
                }
                if (extractedAddress) {
                    return extractedAddress;
                }
            }
            console.warn(`Geocoding failed for ${latitude}, ${longitude}: ${response.data.error || 'No address found.'}`);
            return fallbackAddress;
        }
        catch (error) {
            console.error("Error during geocoding API call:", error);
            return fallbackAddress;
        }
    });
}
