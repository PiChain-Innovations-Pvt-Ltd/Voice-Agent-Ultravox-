import express from "express";
import axios from "axios";

const router = express.Router();

// Helper: pause for given ms
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate haversine distance (km) between two [lat, lon] coords
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const lat1 = toRadians(coord1[0]);
  const lon1 = toRadians(coord1[1]);
  const lat2 = toRadians(coord2[0]);
  const lon2 = toRadians(coord2[1]);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Geocode a place name via Nominatim, with retries
async function geocodePlace(name, limit = 10, retries = 3) {
  let locations = [];
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data } = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: name,
            format: "json",
            addressdetails: 1,
            limit,
          },
        },
      );
      locations = data;
      if (locations.length) break;
    } catch (err) {
      if (attempt < retries - 1) {
        console.log("Geocoding failed; retrying...");
        await sleep(1000);
      } else {
        console.log(`Geocoding failed after ${retries} attempts.`);
      }
    }
  }
  return locations.map((loc) => ({
    name: loc.display_name,
    latitude: parseFloat(loc.lat),
    longitude: parseFloat(loc.lon),
  }));
}

// Reverse-geocode coords to address via Nominatim, with retries
async function getAddressForCoord(lat, lon, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data } = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat,
            lon,
            format: "json",
            addressdetails: 1,
          },
        },
      );
      return data.display_name || "Address not found";
    } catch (err) {
      if (attempt < retries - 1) {
        console.log("Reverse geocoding timed out; retrying...");
        await sleep(1000);
      } else {
        return "Geocoding failed";
      }
    }
  }
}

// Find the candidate closest to target coords
function findClosestCoordinate(candidates, target) {
  let closest = null;
  let minDist = Infinity;

  for (const place of candidates) {
    const dist = calculateDistance(target, [place.latitude, place.longitude]);
    if (dist < minDist) {
      minDist = dist;
      closest = place;
    }
  }

  if (closest) {
    closest.distance_km = minDist;
  }
  return closest;
}

// POST /find-distance
// Body: { latitude: number, longitude: number, placeName: string }
router.post("/find-distance", async (req, res) => {
  const { latitude, longitude, placeName } = req.body;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof placeName !== "string"
  ) {
    return res.status(400).json({
      error:
        "Request body must include numeric 'latitude', 'longitude' and string 'placeName'.",
    });
  }

  try {
    const candidates = await geocodePlace(placeName);
    if (candidates.length === 0) {
      return res.status(404).json({
        error: `No geocoding results found for place '${placeName}'.`,
      });
    }

    const closest = findClosestCoordinate(candidates, [latitude, longitude]);
    const {
      distance_km,
      name: landmark,
      latitude: lat,
      longitude: lon,
    } = closest;
    const address = await getAddressForCoord(lat, lon);

    return res.json({ landmark, distance_km, address });
  } catch (err) {
    console.error("Error in /find-distance:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { router };
