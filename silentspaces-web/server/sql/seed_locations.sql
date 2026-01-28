USE silentspaces;

INSERT INTO locations
(id, name, type, area, distanceMiles, wifi, seating, sockets, lat, lng, bestTime)
VALUES
('lon-001', 'Waterloo Study Lounge', 'Study Space', 'Waterloo / Southbank', 0.7, 1, 1, 1, 51.5033, -0.1133, 'Weekday mornings (9AM–12PM)'),
('lon-002', 'Southbank Quiet Corner', 'Library', 'Southbank', 0.9, 1, 1, 1, 51.5065, -0.1160, 'Late morning (10AM–1PM)'),
('lon-003', 'Liverpool Street Focus Café', 'Café', 'Liverpool Street', 1.4, 1, 1, 0, 51.5176, -0.0820, 'Afternoons (2PM–5PM)'),
('lon-004', 'Shoreditch Work Hub', 'Café', 'Shoreditch', 1.9, 1, 1, 1, 51.5245, -0.0775, 'Weekday mornings (8AM–11AM)'),
('lon-005', 'King''s Cross Reading Room', 'Library', 'King''s Cross', 2.4, 1, 1, 1, 51.5308, -0.1238, 'Weekdays (11AM–4PM)'),
('lon-006', 'Camden Calm Library', 'Library', 'Camden Town', 3.1, 1, 1, 1, 51.5392, -0.1426, 'Early afternoons (12PM–3PM)'),
('lon-007', 'Green Park Bench Zone', 'Park', 'Green Park', 1.2, 0, 1, 0, 51.5048, -0.1426, 'Morning (8AM–11AM)'),
('lon-008', 'Canary Wharf Silent Space', 'Study Space', 'Canary Wharf', 4.3, 1, 1, 1, 51.5054, -0.0235, 'Weekday evenings (5PM–7PM)'),
('lon-009', 'Brixton Community Corner', 'Library', 'Brixton', 3.5, 1, 1, 1, 51.4613, -0.1156, 'Weekdays (10AM–2PM)'),
('lon-010', 'Hammersmith Study Café', 'Café', 'Hammersmith', 4.5, 1, 1, 0, 51.4927, -0.2247, 'Late mornings (9AM–12PM)')
ON DUPLICATE KEY UPDATE
name = VALUES(name),
type = VALUES(type),
area = VALUES(area),
distanceMiles = VALUES(distanceMiles),
wifi = VALUES(wifi),
seating = VALUES(seating),
sockets = VALUES(sockets),
lat = VALUES(lat),
lng = VALUES(lng),
bestTime = VALUES(bestTime);
