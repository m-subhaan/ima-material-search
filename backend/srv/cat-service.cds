using { ima } from '../db/schema';

service CatalogService {
  entity MaterialRequests as projection on ima.MaterialRequests;
} 
