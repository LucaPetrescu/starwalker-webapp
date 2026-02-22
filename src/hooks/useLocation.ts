import {useState, useEffect} from 'react';

interface LocationState {
    coords: {
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
        timestamp: number;
    }
    locatedAt: number | null;
    error: string | null;
}

const useLocation = () => {
    const [location, setLocation] = useState<LocationState>({
      coords: {
        latitude: null,
        longitude: null,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: 0,
      },
      locatedAt: null,
      error: null,
    });

    useEffect(() => {
        if(typeof window === 'undefined' || !("geolocation" in navigator)) {
            setLocation((prevState) => ({
            ...prevState,
            error:
                "Geolocation is not supported by your browser or not available in the current environment",
            }));
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
              },
              locatedAt: position.timestamp,
              error: null,
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            setLocation((prevState) => ({
              ...prevState,
              error: error.message,
            }));
        };

        const watcher = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError
          );
      
          return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    return location;
}

export default useLocation;