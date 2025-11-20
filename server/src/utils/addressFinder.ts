import axios from 'axios';

export async function calculateAddress(latitude: number, longitude: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=18&addressdetails=1`;
    
    const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

    try {
        const response = await axios.get(url, {
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
            } else if (address.road) {
                extractedAddress = address.road;
            } else if (data.display_name) {
                //if road is missing, use display_name but limit its length 
                extractedAddress = data.display_name.split(',').slice(0, 3).join(', ').trim();
            }

            if (extractedAddress) {
                return extractedAddress;
            }
        }
        
        console.warn(`Geocoding failed for ${latitude}, ${longitude}: ${response.data.error || 'No address found.'}`);
        return fallbackAddress;

    } catch (error) {
        console.error("Error during geocoding API call:", error);
        return fallbackAddress;
    }
}