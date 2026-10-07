# Hidden Faces TV

The TV app is separate from the working guest phone site.

## Current behavior
- 12 location profiles for the ONN Google TV devices.
- D-pad / OK / Back remote navigation.
- Each TV remembers its selected location.
- Reads the same Cloudinary guest gallery used by the live app:
  - cloud: `ayyh0pzg`
  - tag: `hiddenfaces2026`
- When a direct MP4 is assigned, the cycle is:
  1. stream location video,
  2. release the video source,
  3. show the shared gallery for 60 seconds,
  4. repeat.
- Videos are not pre-cached in the background.

## Add videos
Edit `app/src/main/assets/tv/index.html`.
Find `PROFILES` and paste a direct HTTPS MP4 URL into each location's `video` field.

A normal YouTube watch URL is not supported by this player. Direct MP4 delivery is preferred.

## Build
GitHub Actions creates an installable debug APK artifact on each TV-source change.
This is for device testing first. Permanent release signing should be added after the TV behavior is approved.
