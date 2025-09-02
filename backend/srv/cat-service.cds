using { ima } from '../db/schema';

service CatalogService {
  entity Materials as projection on ima.Materials;
  entity Vendors   as projection on ima.Vendors;
  entity Plants    as projection on ima.Plants;
} 
