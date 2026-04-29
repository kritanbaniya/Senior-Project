-- alter TYPE if exists public."appointment_status" RENAME TO "apt_st_old";
-- CREATE TYPE appointment_status AS ENUM ('active','requested','pending','canceled','deserted','completed'); 

ALTER TYPE public."appointment_status"
RENAME VALUE 'unseen' TO 'requested';


ALTER TABLE if exists public."staff_permissions" 
ADD COLUMN manage_appointment boolean;








