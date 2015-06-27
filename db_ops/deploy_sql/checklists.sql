CREATE TABLE checklists(
"sampling_event_id" text primary key,
"latitude" real,
"longitude" real,
"year" real,
"month" real,
"day" real,
"time" real,
"country" text,
"state_province" text,
"count_type" text,
"effort_hrs" real,
"effort_distance_km" real,
"effort_area_ha" real,
"observer_id" text,
"number_observers" real,
"group_id" text,
"primary_checklist_flag" text,
"sightings" jsonb);
create index checklists_gin on checklists using gin(sightings);
create index long_in on checklists(longitude); 
create index lat_in on checklists(latitude); 


