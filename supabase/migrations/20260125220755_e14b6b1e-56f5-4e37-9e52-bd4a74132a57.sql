-- Remove test transaction and associated license
DELETE FROM licenses WHERE license_key = 'ZYRA-44I0-UM3R-B0OD';
DELETE FROM transactions WHERE transaction_hash = 'zyra_1769378411180_6nt0w8';