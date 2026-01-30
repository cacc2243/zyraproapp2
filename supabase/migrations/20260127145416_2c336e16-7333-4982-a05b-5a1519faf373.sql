DELETE FROM transactions 
WHERE payment_status = 'waiting_payment' 
AND (
  LOWER(customer_name) LIKE '%test%' 
  OR customer_email ~ '^user[0-9]+@gmail\.com$'
);