-- Per-site credentials for the booking widget's vehicle lookups.
-- Values are read only by server-side API routes and are never sent to public pages.

ALTER TABLE `booking_settings`
  ADD COLUMN `vehicle_api` JSON NULL AFTER `appearance`;
