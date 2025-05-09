import axios from "axios";

// Function to geocode place (get latitude and longitude from place name)
async function geocodePlace(name, limit = 10, retries = 3) {
  let locations = [];
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(
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
      locations = response.data;
      if (locations.length) break;
    } catch (error) {
      if (attempt < retries - 1) {
        console.log(`Geocoding failed. Retrying...`);
        await sleep(1000);
        continue;
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

// Function to calculate distance between two coordinates using geodesic distance
function calculateDistance(coord1, coord2) {
  const R = 6371; // Radius of the Earth in km
  const lat1 = toRadians(coord1[0]);
  const lon1 = toRadians(coord1[1]);
  const lat2 = toRadians(coord2[0]);
  const lon2 = toRadians(coord2[1]);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
}

// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to find the closest coordinate from a list of candidates
function findClosestCoordinate(candidates, target) {
  let closest = null;
  let minDist = Infinity;

  candidates.forEach((place) => {
    const dist = calculateDistance(target, [place.latitude, place.longitude]);
    if (dist < minDist) {
      minDist = dist;
      closest = place;
    }
  });

  if (closest !== null) {
    closest.distance_km = minDist;
  }

  return closest;
}

// Function to reverse geocode (get address from coordinates)
async function getAddressForCoord(lat, lng, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat,
            lon: lng,
            format: "json",
            addressdetails: 1,
          },
        },
      );
      return response.data.display_name || "Address not found";
    } catch (error) {
      if (attempt < retries - 1) {
        console.log("Geocoding service timed out. Retrying...");
        await sleep(1000);
        continue;
      } else {
        return "Geocoding failed";
      }
    }
  }
}

// Helper function for sleep (delay in ms)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Express route for processing the request
app.post("/find-distance", async (req, res) => {
  const { latitude, longitude, placeName } = req.body;

  if (!latitude || !longitude || !placeName) {
    return res.status(400).json({
      error: "Missing 'latitude', 'longitude' or 'placeName' in request body",
    });
  }

  try {
    // Step 2: Geocode the place name (get candidates)
    const candidates = await geocodePlace(placeName);
    if (candidates.length === 0) {
      return res.status(404).json({
        error: `No geocoding results found for place '${placeName}'.`,
      });
    }

    // Step 3: Find the closest candidate to the provided coordinates (latitude, longitude)
    const closest = findClosestCoordinate(candidates, [latitude, longitude]);

    // Optional: Reverse geocode the closest coordinates to get the full address
    const address = await getAddressForCoord(
      closest.latitude,
      closest.longitude,
    );

    return res.json({
      closestLocation: closest,
      address,
    });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
