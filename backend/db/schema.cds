namespace ima;

entity MaterialRequests {
  key materialID          : String;  // For BE Administration, not to show on UI
      materialName        : String;
      vendor              : String;
      plant               : String;
      materialDescription : String;
      firstName           : String;
      lastName            : String;
      email               : String;
      status              : String;  // pendingApproval, pendingIMA, completedByIMA
      materialNumber      : String;  // Will be filled after approval
      createdAt           : DateTime;
      createdBy           : String;
      modifiedAt          : DateTime;
      modifiedBy          : String;
} 
