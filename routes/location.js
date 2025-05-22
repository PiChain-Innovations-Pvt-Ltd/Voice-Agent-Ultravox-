import express from "express";
import axios from "axios";
import { fetch } from "undici";
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
  const baseUrl = "https://nominatim.openstreetmap.org/search";
  const headers = {
    "User-Agent": "curl-distance-debug"
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    const params = new URLSearchParams({
      q: name,
      format: "json",
      addressdetails: "1",
      limit: limit.toString(),
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log(`🌍 Geocoding request (attempt ${attempt + 1}):`);
    console.log(`curl "${fullUrl}" -H "User-Agent: curl-distance-debug"`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 2s timeout

      const response = await fetch(fullUrl, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      locations = data;
      if (locations.length) break;
    } catch (err) {
      console.log(`❌ Geocoding failed on attempt ${attempt + 1}: ${err.message}`);
      if (attempt < retries - 1) await sleep(1000);
      else console.log(`⛔ Geocoding failed after ${retries} attempts.`);
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
          timeout: 2000
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
// Body: { placeA: string, placeB: string }
router.post("/find-distance", async (req, res) => {
  let { placeA, placeB } = req.body;
  console.log(req.body)
  console.log("inside find-distance")
  if (typeof placeA !== "string" || typeof placeB !== "string") {
    return res.status(400).json({
      error: "Request body must include 'placeA' and 'placeB' as strings.",
    });
  }

  try {
    // const [candidatesA, candidatesB] = await Promise.all([
    //   geocodePlace(placeA),
    //   geocodePlace(placeB),
    // ]);
    const candidatesA = await geocodePlace(placeA);
    await sleep(1000);
    const candidatesB = await geocodePlace(placeB);


    if (candidatesA.length === 0 || candidatesB.length === 0) {
      return res.status(404).json({
        error: `Could not find both locations. Missing: ${
          candidatesA.length === 0 ? "placeA" : "placeB"
        }`,
      });
    }

    const coordA = [candidatesA[0].latitude, candidatesA[0].longitude];
    const coordB = [candidatesB[0].latitude, candidatesB[0].longitude];
    const distance_km = calculateDistance(coordA, coordB);

    const addressA = await getAddressForCoord(coordA[0], coordA[1]);
    const addressB = await getAddressForCoord(coordB[0], coordB[1]);

    return res.json({
      from: {
        name: candidatesA[0].name,
        coordinates: coordA,
        address: addressA,
      },
      to: {
        name: candidatesB[0].name,
        coordinates: coordB,
        address: addressB,
      },
      distance_km,
    });
  } catch (err) {
    console.error("Error in /find-distance:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export { router };
