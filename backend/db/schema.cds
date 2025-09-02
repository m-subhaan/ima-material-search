namespace ima;

entity Materials {
  key requestID           : String;
      materialsID         : String;
      materialNumber      : String;
      materialName        : String;
      materialDescription : String;
      createdAt           : Date;
      createdBy           : String;
      modifiedAt          : Date;
      modifiedBy          : String;
      status              : String;
      plant_ID            : String;
      vendor_ID           : String;
      requestorFirstName  : String;
      requestorLastName   : String;
      requestorEmail      : String;
}

entity Vendors {
  key vendor_ID     : String;
      vendorName    : String;
      vendorLocation: String;
}

entity Plants {
  key plant_ID      : String;
      plantName     : String;
      plantLocation : String;
} 
