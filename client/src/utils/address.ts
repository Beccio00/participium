import axios from "axios";

export const fetchAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18&addressdetails=1`;

  try {
    const response = await axios.get(url, {
      headers: { "Accept-Language": "en" },
    });

    if (response.status === 200 && response.data.display_name) {
      const data = response.data;
      const addr = data.address;
      let extractedAddress = "";

      if (addr.road && addr.house_number) {
        extractedAddress = `${addr.road}, ${addr.house_number}`;
      } else if (addr.road) {
        extractedAddress = addr.road;
      } else if (data.display_name) {
        extractedAddress = data.display_name
          .split(",")
          .slice(0, 3)
          .join(", ")
          .trim();
      }

      return extractedAddress || "Address not available";
    } else {
      return "Address not available";
    }
  } catch (err) {
    console.error("Error fetching address:", err);
    return "Unable to retrieve address";
  }
};