/*
  # Add automatic request number generation trigger

  1. Changes
    - Create trigger to automatically generate request_number before insert
    - The trigger will call the generate_request_number() function
    - Ensures every prayer request gets a unique sequential number
*/

CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_request_number_trigger ON prayer_requests;

CREATE TRIGGER set_request_number_trigger
BEFORE INSERT ON prayer_requests
FOR EACH ROW
EXECUTE FUNCTION set_request_number();
