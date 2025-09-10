sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function(Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("openui5.hello.world.controller.Main", {
        onInit: function() {
            // Check if user is authenticated
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            if (!oUserModel.getProperty("/isAuthenticated")) {
                this._navigateToLogin();
                return;
            }
            
            // Get router and attach to route matched event
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        onLogoutPress: function() {
            // Clear user model
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/isAuthenticated", false);
            oUserModel.setProperty("/currentUser", null);
            oUserModel.setProperty("/userPersona", null);
            
            MessageToast.show("Logged out successfully");
            this._navigateToLogin();
        },

        _navigateToLogin: function() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("login");
        },

        _onRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            
            // If we're on the main route and user is MaterialSearchUser, populate dropdowns
            if (sRouteName === "main") {
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                var sPersona = oUserModel.getProperty("/userPersona");
                
                if (sPersona === "MaterialSearchUser") {
                    console.log("Route matched for MaterialSearchUser, fragment will handle dropdown population");
                }
            }
        },

        // MaterialSearchUser Functions
        onApplyFilters: function() {
            var sMaterialName = this.byId("materialNameFilter").getValue().toLowerCase();
            var sMaterialNumber = this.byId("materialNumberFilter").getValue().toLowerCase();
            var sDescription = this.byId("descriptionFilter").getValue().toLowerCase();
            var sVendor = this.byId("vendorFilter").getSelectedKey();
            var sPlant = this.byId("plantFilter").getSelectedKey();
            
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Get filtered materials based on current user persona
            var aPersonaFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            var aFilteredMaterials = aPersonaFilteredMaterials.filter(function(material) {
                var bNameMatch = !sMaterialName || material.materialName.toLowerCase().includes(sMaterialName);
                var bNumberMatch = !sMaterialNumber || (material.materialNumber && material.materialNumber.toLowerCase().includes(sMaterialNumber));
                var bDescriptionMatch = !sDescription || material.materialDescription.toLowerCase().includes(sDescription);
                var bVendorMatch = !sVendor || material.vendor === sVendor;
                var bPlantMatch = !sPlant || material.plant === sPlant;
                
                return bNameMatch && bNumberMatch && bDescriptionMatch && bVendorMatch && bPlantMatch;
            });
            
            // Update pagination with filtered results
            this._updatePagination(aFilteredMaterials, 1, oMaterialsModel.getProperty("/pageSize"));
            
            var sPersona = this.getOwnerComponent().getModel("userModel").getProperty("/userPersona");
            var sPersonaText = sPersona === "MaterialSearchUser" ? "completedByIMA" : 
                              sPersona === "MaterialCreateUser" ? "non-approved" : "all";
            
            MessageToast.show("Filters applied. Found " + aFilteredMaterials.length + " " + sPersonaText + " materials.");
        },

        onClearFilters: function() {
            this.byId("materialNameFilter").setValue("");
            this.byId("materialNumberFilter").setValue("");
            this.byId("descriptionFilter").setValue("");
            this.byId("vendorFilter").setSelectedKey("");
            this.byId("plantFilter").setSelectedKey("");
            
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            this._updatePagination(aFilteredMaterials, 1, oMaterialsModel.getProperty("/pageSize"));
            
            var sPersona = this.getOwnerComponent().getModel("userModel").getProperty("/userPersona");
            var sPersonaText = sPersona === "MaterialSearchUser" ? "completedByIMA" : 
                              sPersona === "MaterialCreateUser" ? "non-approved" : "all";
            
            MessageToast.show("Filters cleared. Showing all " + sPersonaText + " materials.");
        },



        onCreateMaterialRequest: function() {
            this.byId("createMaterialDialog").open();
        },

        onCancelCreateMaterial: function() {
            this.byId("createMaterialDialog").close();
        },

        onSubmitMaterialRequest: function() {
            var sName = this.byId("materialName").getValue();
            var sDescription = this.byId("materialDescription").getValue();
            var sVendor = this.byId("materialVendor").getSelectedKey();
            var sPlant = this.byId("materialPlant").getSelectedKey();
            var sFirstName = this.byId("dialogRequestorFirstName").getValue();
            var sLastName = this.byId("dialogRequestorLastName").getValue();
            var sEmail = this.byId("dialogRequestorEmail").getValue();
            
            if (!sName || !sDescription || !sVendor || !sPlant || !sFirstName || !sLastName || !sEmail) {
                MessageToast.show("Please fill in all required fields");
                return;
            }
            
            // Generate unique material ID
            var sMaterialID = "MAT_REQ_" + Date.now().toString().padStart(6, '0');
            
            // Create new material request for OData
            var oNewMaterialRequest = {
                materialID: sMaterialID,
                materialName: sName,
                vendor: sVendor,
                plant: sPlant,
                materialDescription: sDescription,
                firstName: sFirstName,
                lastName: sLastName,
                email: sEmail,
                status: "pendingApproval",
                materialNumber: "", // Will be filled after approval
                createdAt: new Date().toISOString(),
                createdBy: this.getOwnerComponent().getModel("userModel").getProperty("/currentUser/username") || "user",
                modifiedAt: new Date().toISOString(),
                modifiedBy: this.getOwnerComponent().getModel("userModel").getProperty("/currentUser/username") || "user"
            };
            
            var that = this;
            
            // Create material request via fetch API
            fetch("http://localhost:4004/odata/v4/catalog/MaterialRequests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oNewMaterialRequest)
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to create material request");
                }
            })
            .then(function(oData) {
                console.log("Material request created successfully:", oData);
                
                // Refresh the data from OData
                that.getOwnerComponent()._loadInitialData();
                
                // Clear form and close dialog
                that._clearMaterialForm();
                that.byId("createMaterialDialog").close();
                
                MessageToast.show("Material request created successfully! Request has been submitted for approval.");
            })
            .catch(function(oError) {
                console.error("Failed to create material request:", oError);
                MessageToast.show("Failed to create material request. Please try again.");
            });
        },

        _clearMaterialForm: function() {
            this.byId("materialName").setValue("");
            this.byId("materialDescription").setValue("");
            
            // Clear dropdown selections (no prefilled values)
            this.byId("materialVendor").setSelectedKey("");
            this.byId("materialPlant").setSelectedKey("");
            
            this.byId("dialogRequestorFirstName").setValue("");
            this.byId("dialogRequestorLastName").setValue("");
            this.byId("dialogRequestorEmail").setValue("");
        },

        onViewMaterialDetails: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialRequestsModel");
            var oMaterial = oContext.getObject();
            
            // Bind material to detail dialog
            var oDetailDialog = this.byId("materialDetailsDialog");
            oDetailDialog.bindElement({
                path: oContext.getPath(),
                model: "materialRequestsModel"
            });
            
            oDetailDialog.open();
        },

        onCloseMaterialDetails: function() {
            this.byId("materialDetailsDialog").close();
        },

        // MaterialCreateUser Functions
        onStatusFilterChange: function(oEvent) {
            var sSelectedStatus = oEvent.getParameter("selectedItem").getKey();
            var oRequestsModel = this.getOwnerComponent().getModel("requestsModel");
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            
            // Always ensure we have the latest data from materials model
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            if (sSelectedStatus === "all") {
                // Show all requests (materials with requested or emailSentToIMA status)
                var aAllRequests = aAllMaterials.filter(function(material) {
                    return material.status === "pendingApproval" || material.status === "pendingIMA";
                });
                oRequestsModel.setProperty("/requests", aAllRequests);
                
                // Update counts
                var pendingCount = aAllRequests.filter(function(request) {
                    return request.status === "pendingApproval";
                }).length;
                var emailSentCount = aAllRequests.filter(function(request) {
                    return request.status === "pendingIMA";
                }).length;
                oRequestsModel.setProperty("/pendingCount", pendingCount);
                oRequestsModel.setProperty("/emailSentCount", emailSentCount);
            } else {
                // Filter by specific status
                var aFilteredRequests = aAllMaterials.filter(function(material) {
                    return material.status === sSelectedStatus;
                });
                oRequestsModel.setProperty("/requests", aFilteredRequests);
                
                // Update counts for filtered results
                var pendingCount = aFilteredRequests.filter(function(request) {
                    return request.status === "pendingApproval";
                }).length;
                var emailSentCount = aFilteredRequests.filter(function(request) {
                    return request.status === "pendingIMA";
                }).length;
                oRequestsModel.setProperty("/pendingCount", pendingCount);
                oRequestsModel.setProperty("/emailSentCount", emailSentCount);
            }
            
            // Force refresh of the requests model
            oRequestsModel.refresh(true);
            
            MessageToast.show("Filter applied. Showing " + oRequestsModel.getProperty("/requests").length + " requests.");
        },

        onRefreshRequests: function() {
            var oComponent = this.getOwnerComponent();
            oComponent._loadInitialData();
            
            // Reset filter to "all"
            this.byId("statusFilter").setSelectedKey("all");
            
            MessageToast.show("Requests refreshed");
        },

        _updateMaterialStatusOData: function(sRequestID, sNewStatus, fnCallback, sApprovedDate) {
            var sModifiedDate = sApprovedDate || new Date().toISOString().split('T')[0];
            var oUpdateData = {
                status: sNewStatus,
                modifiedAt: sModifiedDate,
                modifiedBy: "admin"
            };
            
            // Update material via fetch API
            fetch("http://localhost:4004/odata/v4/catalog/Materials(" + sRequestID + ")", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oUpdateData)
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to update material status");
                }
            })
            .then(function(oData) {
                console.log("Material status updated successfully:", oData);
                
                // Refresh the data from OData
                this.getOwnerComponent()._loadInitialData();
                
                if (fnCallback) {
                    fnCallback();
                }
            }.bind(this))
            .catch(function(oError) {
                console.error("Failed to update material status:", oError);
                MessageToast.show("Failed to update material status. Please try again.");
            });
        },

        // Ensure requests are properly synchronized when MaterialCreateUser views the screen
        onAfterRendering: function() {
            // Check if this is MaterialCreateUser and ensure requests are up-to-date
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            var sPersona = oUserModel.getProperty("/userPersona");
            
            if (sPersona === "MaterialCreateUser") {
                this._syncRequestsModel();
            }
            
            // Apply persona-based filtering for all users
            this._applyPersonaBasedFiltering();
            
            // Fallback: If MaterialSearchUser and dropdowns are not populated, try to populate them
            if (sPersona === "MaterialSearchUser") {
                var oVendorFilter = this.byId("vendorFilter");
                if (oVendorFilter && oVendorFilter.getItems().length <= 1) {
                    console.log("Fallback: Populating dropdowns from onAfterRendering");
                    this._populateDropdownsFromModels();
                }
                // Populate filter dropdowns
                this._populateFilterDropdowns();
            }
        },


        _waitForFragmentAndPopulateDropdowns: function() {
            var that = this;
            var maxAttempts = 50; // Increased for fragment loading
            var attemptCount = 0;
            
            function checkFragmentAndPopulate() {
                attemptCount++;
                console.log("Checking for fragment controls, attempt", attemptCount);
                
                var oVendorFilter = that.byId("vendorFilter");
                var oPlantFilter = that.byId("plantFilter");
                
                if (oVendorFilter && oPlantFilter) {
                    console.log("Fragment controls found, populating dropdowns...");
                    that._populateDropdownsFromModels();
                } else if (attemptCount < maxAttempts) {
                    console.log("Fragment controls not ready yet, retrying...");
                    setTimeout(checkFragmentAndPopulate, 200);
                } else {
                    console.error("Failed to find fragment controls after", maxAttempts, "attempts");
                }
            }
            
            checkFragmentAndPopulate();
        },

        onMaterialSearchFragmentRendered: function() {
            console.log("MaterialSearch fragment rendered, populating dropdowns...");
            this._populateDropdownsFromModels();
        },

        _populateDropdownsFromModels: function() {
            console.log("_populateDropdownsFromModels called");
            var oVendorsModel = this.getOwnerComponent().getModel("vendorsModel");
            var oPlantsModel = this.getOwnerComponent().getModel("plantsModel");
            var aVendors = oVendorsModel.getProperty("/vendors") || [];
            var aPlants = oPlantsModel.getProperty("/plants") || [];
            
            console.log("Vendors from model:", aVendors.length, aVendors);
            console.log("Plants from model:", aPlants.length, aPlants);
            
            if (aVendors.length > 0) {
                this._populateVendorDropdowns(aVendors);
            } else {
                console.warn("No vendors found in model");
            }
            if (aPlants.length > 0) {
                this._populatePlantDropdowns(aPlants);
            } else {
                console.warn("No plants found in model");
            }
        },

        _populateVendorDropdowns: function(aVendors) {
            console.log("_populateVendorDropdowns called with", aVendors.length, "vendors");
            var oVendorFilter = this.byId("vendorFilter");
            var oMaterialVendor = this.byId("materialVendor");
            
            console.log("Vendor filter control:", oVendorFilter);
            console.log("Material vendor control:", oMaterialVendor);
            
            if (oVendorFilter) {
                console.log("Populating vendor filter dropdown");
                oVendorFilter.destroyItems();
                oVendorFilter.addItem(new sap.ui.core.Item({key: "", text: "All Vendors"}));
                aVendors.forEach(function(vendor) {
                    oVendorFilter.addItem(new sap.ui.core.Item({
                        key: vendor.vendor_ID, 
                        text: vendor.vendorName
                    }));
                });
                console.log("Vendor filter dropdown populated with", oVendorFilter.getItems().length, "items");
            } else {
                console.error("Vendor filter control not found");
            }
            
            if (oMaterialVendor) {
                console.log("Populating material vendor dropdown");
                oMaterialVendor.destroyItems();
                aVendors.forEach(function(vendor) {
                    oMaterialVendor.addItem(new sap.ui.core.Item({
                        key: vendor.vendor_ID, 
                        text: vendor.vendorName
                    }));
                });
                if (aVendors.length > 0) {
                    oMaterialVendor.setSelectedKey(aVendors[0].vendor_ID);
                }
                console.log("Material vendor dropdown populated with", oMaterialVendor.getItems().length, "items");
            } else {
                console.error("Material vendor control not found");
            }
        },

        _populatePlantDropdowns: function(aPlants) {
            console.log("_populatePlantDropdowns called with", aPlants.length, "plants");
            var oPlantFilter = this.byId("plantFilter");
            var oMaterialPlant = this.byId("materialPlant");
            
            console.log("Plant filter control:", oPlantFilter);
            console.log("Material plant control:", oMaterialPlant);
            
            if (oPlantFilter) {
                console.log("Populating plant filter dropdown");
                oPlantFilter.destroyItems();
                oPlantFilter.addItem(new sap.ui.core.Item({key: "", text: "All Plants"}));
                aPlants.forEach(function(plant) {
                    oPlantFilter.addItem(new sap.ui.core.Item({
                        key: plant.plant_ID, 
                        text: plant.plantName
                    }));
                });
                console.log("Plant filter dropdown populated with", oPlantFilter.getItems().length, "items");
            } else {
                console.error("Plant filter control not found");
            }
            
            if (oMaterialPlant) {
                console.log("Populating material plant dropdown");
                oMaterialPlant.destroyItems();
                aPlants.forEach(function(plant) {
                    oMaterialPlant.addItem(new sap.ui.core.Item({
                        key: plant.plant_ID, 
                        text: plant.plantName
                    }));
                });
                if (aPlants.length > 0) {
                    oMaterialPlant.setSelectedKey(aPlants[0].plant_ID);
                }
                console.log("Material plant dropdown populated with", oMaterialPlant.getItems().length, "items");
            } else {
                console.error("Material plant control not found");
            }
        },

        _syncRequestsModel: function() {
            var oRequestsModel = this.getOwnerComponent().getModel("requestsModel");
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            
            // Get all materials and filter for requests
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            var aRequests = aAllMaterials.filter(function(material) {
                return material.status === "pendingApproval" || material.status === "pendingIMA";
            });
            
            // Update requests model
            oRequestsModel.setProperty("/requests", aRequests);
            
            // Update counts
            var pendingCount = aRequests.filter(function(request) {
                return request.status === "pendingApproval";
            }).length;
            var emailSentCount = aRequests.filter(function(request) {
                return request.status === "pendingIMA";
            }).length;
            
            oRequestsModel.setProperty("/pendingCount", pendingCount);
            oRequestsModel.setProperty("/emailSentCount", emailSentCount);
            
            // Force refresh
            oRequestsModel.refresh(true);
        },

        onSyncRequests: function() {
            this._syncRequestsModel();
            MessageToast.show("Requests synchronized. Found " + this.getOwnerComponent().getModel("requestsModel").getProperty("/requests").length + " requests.");
        },

        onSendEmailToIMA: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("requestsModel");
            var oMaterial = oContext.getObject();
            
            // Show confirmation dialog
            var oConfirmDialog = this.byId("actionConfirmDialog");
            this.byId("actionConfirmText").setText("Are you sure you want to send email to IMA for material '" + oMaterial.materialName + "'?");
            oConfirmDialog.data("material", oMaterial);
            oConfirmDialog.data("action", "sendEmail");
            oConfirmDialog.open();
        },

        onCloseRequest: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("requestsModel");
            var oMaterial = oContext.getObject();
            
            // Show confirmation dialog
            var oConfirmDialog = this.byId("actionConfirmDialog");
            this.byId("actionConfirmText").setText("Are you sure you want to close the request for material '" + oMaterial.materialName + "'? This will approve the material.");
            oConfirmDialog.data("material", oMaterial);
            oConfirmDialog.data("action", "closeRequest");
            oConfirmDialog.open();
        },

        onConfirmAction: function() {
            var oConfirmDialog = this.byId("actionConfirmDialog");
            var oMaterial = oConfirmDialog.data("material");
            var sAction = oConfirmDialog.data("action");
            var that = this;
            
            if (sAction === "sendEmail") {
                // Update status to emailSentToIMA via OData
                this._updateMaterialStatusOData(oMaterial.requestID, "pendingIMA", function() {
                    MessageToast.show("Email sent to IMA successfully");
                });
            } else if (sAction === "closeRequest") {
                // Update status to approved via OData
                var sApprovedDate = new Date().toISOString().split('T')[0];
                this._updateMaterialStatusOData(oMaterial.requestID, "completedByIMA", function() {
                    MessageToast.show("Request closed and material approved successfully");
                }, sApprovedDate);
            }
            
            oConfirmDialog.close();
        },

        onCancelAction: function() {
            this.byId("actionConfirmDialog").close();
        },

        onViewRequestDetails: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("requestsModel");
            var oRequest = oContext.getObject();
            
            // Bind request to detail dialog
            var oDetailDialog = this.byId("requestDetailsDialog");
            oDetailDialog.bindElement({
                path: oContext.getPath(),
                model: "requestsModel"
            });
            
            oDetailDialog.open();
        },

        onCloseRequestDetails: function() {
            this.byId("requestDetailsDialog").close();
        },

        // MaterialApprover Functions
        onSendEmailToIMA: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialRequestsModel");
            var oMaterial = oContext.getObject();
            
            // Show confirmation dialog
            var oConfirmDialog = this.byId("actionConfirmDialog");
            this.byId("actionConfirmText").setText("Are you sure you want to send email to IMA for material '" + oMaterial.materialName + "'?");
            oConfirmDialog.data("material", oMaterial);
            oConfirmDialog.data("action", "sendEmail");
            oConfirmDialog.open();
        },

        onCloseRequest: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialRequestsModel");
            var oMaterial = oContext.getObject();
            
            // Store the material for later use and open material number dialog
            this._currentMaterial = oMaterial;
            this.byId("materialNumberInput").setValue("");
            this.byId("materialNumberDialog").open();
        },

        onCancelMaterialNumberDialog: function() {
            this.byId("materialNumberDialog").close();
            this._currentMaterial = null;
        },

        onConfirmMaterialNumber: function() {
            var sMaterialNumber = this.byId("materialNumberInput").getValue();
            
            if (!sMaterialNumber || sMaterialNumber.trim() === "") {
                MessageToast.show("Please enter a material number");
                return;
            }
            
            var oMaterial = this._currentMaterial;
            if (!oMaterial) {
                MessageToast.show("No material selected");
                return;
            }
            
            // Update the material request with material number and approved status
            this._updateMaterialRequestStatus(oMaterial.materialID, "completedByIMA", sMaterialNumber);
            
            // Close dialog and clear current material
            this.byId("materialNumberDialog").close();
            this._currentMaterial = null;
        },

        onConfirmAction: function() {
            var oConfirmDialog = this.byId("actionConfirmDialog");
            var oMaterial = oConfirmDialog.data("material");
            var sAction = oConfirmDialog.data("action");
            
            if (sAction === "sendEmail") {
                // Update status to emailSentToIMA
                this._updateMaterialRequestStatus(oMaterial.materialID, "pendingIMA");
            }
            
            oConfirmDialog.close();
        },

        onCancelAction: function() {
            this.byId("actionConfirmDialog").close();
        },

        _updateMaterialRequestStatus: function(sMaterialID, sNewStatus, sMaterialNumber) {
            var oUpdateData = {
                status: sNewStatus,
                modifiedAt: new Date().toISOString(),
                modifiedBy: this.getOwnerComponent().getModel("userModel").getProperty("/currentUser/username") || "approver"
            };
            
            // Add material number if provided (for approval)
            if (sMaterialNumber) {
                oUpdateData.materialNumber = sMaterialNumber;
            }
            
            var that = this;
            
            // Update material request via fetch API
            fetch("http://localhost:4004/odata/v4/catalog/MaterialRequests(" + sMaterialID + ")", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oUpdateData)
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to update material request status");
                }
            })
            .then(function(oData) {
                console.log("Material request status updated successfully:", oData);
                
                // Refresh the data from OData
                that.getOwnerComponent()._loadInitialData();
                
                var sMessage = sNewStatus === "pendingIMA" ? 
                    "Email sent to IMA successfully" : 
                    "Request approved successfully with material number: " + sMaterialNumber;
                
                MessageToast.show(sMessage);
            })
            .catch(function(oError) {
                console.error("Failed to update material request status:", oError);
                MessageToast.show("Failed to update material request status. Please try again.");
            });
        },

        onViewRequestDetails: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialRequestsModel");
            var oRequest = oContext.getObject();
            
            // Bind request to detail dialog
            var oDetailDialog = this.byId("requestDetailsDialog");
            oDetailDialog.bindElement({
                path: oContext.getPath(),
                model: "materialRequestsModel"
            });
            
            oDetailDialog.open();
        },

        onRefreshRequests: function() {
            var oComponent = this.getOwnerComponent();
            oComponent._loadInitialData();
            MessageToast.show("Requests refreshed");
        },

        formatDate: function(sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            return oDate.toLocaleDateString() + " " + oDate.toLocaleTimeString();
        },

        onStatusFilterChange: function(oEvent) {
            var sSelectedStatus = oEvent.getParameter("selectedItem").getKey();
            var oMaterialRequestsModel = this.getOwnerComponent().getModel("materialRequestsModel");
            
            // Get all material requests
            var aAllMaterialRequests = oMaterialRequestsModel.getProperty("/materialRequests");
            var aFilteredRequests;
            
            if (sSelectedStatus === "all") {
                // Show all non-approved requests
                aFilteredRequests = aAllMaterialRequests.filter(function(material) {
                    return material.status === "pendingApproval" || material.status === "pendingIMA";
                });
            } else {
                // Filter by specific status
                aFilteredRequests = aAllMaterialRequests.filter(function(material) {
                    return material.status === sSelectedStatus;
                });
            }
            
            // Update the pending requests
            oMaterialRequestsModel.setProperty("/pendingRequests", aFilteredRequests);
            
            MessageToast.show("Filter applied. Showing " + aFilteredRequests.length + " requests.");
        },

        onSyncRequests: function() {
            // This function syncs the requests - essentially a refresh
            this.onRefreshRequests();
        },

        // AnalystUser Functions
        onAnalystStatusFilterChange: function() {
            // Filter will be applied when Apply Filters is clicked
        },

        onAnalystVendorFilterChange: function() {
            // Filter will be applied when Apply Filters is clicked
        },

        onApplyAnalystFilters: function() {
            var sStatusFilter = this.byId("analystStatusFilter").getSelectedKey();
            var sVendorFilter = this.byId("analystVendorFilter").getSelectedKey();
            var sSearchTerm = this.byId("analystSearchInput").getValue().toLowerCase();
            var oFromDate = this.byId("analystFromDateFilter").getDateValue();
            var oToDate = this.byId("analystToDateFilter").getDateValue();
            
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            var aFilteredMaterials = aAllMaterials.filter(function(material) {
                var bStatusMatch = sStatusFilter === "all" || material.status === sStatusFilter;
                var bVendorMatch = sVendorFilter === "all" || material.vendor_ID === sVendorFilter;
                var bSearchMatch = !sSearchTerm || 
                    material.materialName.toLowerCase().includes(sSearchTerm) ||
                    material.materialDescription.toLowerCase().includes(sSearchTerm) ||
                    material.materialNumber.toLowerCase().includes(sSearchTerm) ||
                    (material.requestID && material.requestID.toLowerCase().includes(sSearchTerm));
                
                // Date filtering
                var bDateMatch = true;
                if (oFromDate || oToDate) {
                    var materialDate = new Date(material.createdAt);
                    if (oFromDate && materialDate < oFromDate) {
                        bDateMatch = false;
                    }
                    if (oToDate && materialDate > oToDate) {
                        bDateMatch = false;
                    }
                }
                
                return bStatusMatch && bVendorMatch && bSearchMatch && bDateMatch;
            });
            
            // Update filteredMaterials for analyst view
            oMaterialsModel.setProperty("/filteredMaterials", aFilteredMaterials);
            
            // Also update pagination for analyst view
            this._updatePagination(aFilteredMaterials, 1, oMaterialsModel.getProperty("/pageSize"));
            
            MessageToast.show("Filters applied. Found " + aFilteredMaterials.length + " materials.");
        },

        onClearAnalystFilters: function() {
            this.byId("analystStatusFilter").setSelectedKey("all");
            this.byId("analystVendorFilter").setSelectedKey("all");
            this.byId("analystSearchInput").setValue("");
            this.byId("analystFromDateFilter").setValue("");
            this.byId("analystToDateFilter").setValue("");
            
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Update filteredMaterials for analyst view
            oMaterialsModel.setProperty("/filteredMaterials", aAllMaterials);
            
            // Also update pagination for analyst view
            this._updatePagination(aAllMaterials, 1, oMaterialsModel.getProperty("/pageSize"));
            
            MessageToast.show("Filters cleared");
        },

        onExportAnalystData: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aMaterials = oMaterialsModel.getProperty("/filteredMaterials");
            
            // Create CSV content
            var sCSV = "Request ID,Material ID,Material Number,Material Name,Description,Status,Created By,Created Date,Modified Date,Modified By,Vendor,Plant\n";
            aMaterials.forEach(function(material) {
                sCSV += (material.requestID || "") + "," + 
                        material.materialsID + "," + 
                        material.materialNumber + "," + 
                        material.materialName + "," + 
                        material.materialDescription + "," + 
                        material.status + "," + 
                        material.createdBy + "," + 
                        material.createdAt + "," + 
                        material.modifiedAt + "," + 
                        material.modifiedBy + "," + 
                        (material.vendorName || material.vendor_ID) + "," + 
                        (material.plantName || material.plant_ID) + "\n";
            });
            
            // Create download link
            var sBlob = new Blob([sCSV], { type: "text/csv" });
            var sUrl = window.URL.createObjectURL(sBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "materials_export_" + new Date().toISOString().split('T')[0] + ".csv";
            oLink.click();
            window.URL.revokeObjectURL(sUrl);
            
            MessageToast.show("Data exported successfully");
        },

        onViewAnalystMaterialDetails: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialsModel");
            var oMaterial = oContext.getObject();
            
            // Bind material to detail dialog
            var oDetailDialog = this.byId("analystMaterialDetailsDialog");
            oDetailDialog.bindElement({
                path: oContext.getPath(),
                model: "materialsModel"
            });
            
            oDetailDialog.open();
        },

        onCloseAnalystMaterialDetails: function() {
            this.byId("analystMaterialDetailsDialog").close();
        },

        onViewAnalystMaterialSpecs: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("materialsModel");
            var oMaterial = oContext.getObject();
            
            // Bind material to specs dialog
            var oSpecsDialog = this.byId("analystMaterialSpecsDialog");
            oSpecsDialog.bindElement({
                path: oContext.getPath(),
                model: "materialsModel"
            });
            
            oSpecsDialog.open();
        },

        onCloseAnalystMaterialSpecs: function() {
            this.byId("analystMaterialSpecsDialog").close();
        },

        // Pagination Methods
        onPageSizeChange: function(oEvent) {
            var iNewPageSize = parseInt(oEvent.getParameter("selectedItem").getKey());
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            this._updatePagination(aFilteredMaterials, 1, iNewPageSize);
        },

        onPreviousPage: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var iCurrentPage = oMaterialsModel.getProperty("/currentPage");
            var iPageSize = oMaterialsModel.getProperty("/pageSize");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            if (iCurrentPage > 1) {
                this._updatePagination(aFilteredMaterials, iCurrentPage - 1, iPageSize);
            }
        },

        onNextPage: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var iCurrentPage = oMaterialsModel.getProperty("/currentPage");
            var iPageSize = oMaterialsModel.getProperty("/pageSize");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            var iTotalPages = oMaterialsModel.getProperty("/totalPages");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            if (iCurrentPage < iTotalPages) {
                this._updatePagination(aFilteredMaterials, iCurrentPage + 1, iPageSize);
            }
        },

        _updatePagination: function(aMaterials, currentPage, pageSize) {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var totalItems = aMaterials.length;
            var totalPages = Math.ceil(totalItems / pageSize);
            var startIndex = ((currentPage - 1) * pageSize) + 1;
            var endIndex = Math.min(currentPage * pageSize, totalItems);
            
            var start = (currentPage - 1) * pageSize;
            var end = start + pageSize;
            var pageMaterials = aMaterials.slice(start, end);
            
            oMaterialsModel.setProperty("/filteredMaterials", pageMaterials);
            oMaterialsModel.setProperty("/currentPage", currentPage);
            oMaterialsModel.setProperty("/pageSize", pageSize);
            oMaterialsModel.setProperty("/totalPages", totalPages);
            oMaterialsModel.setProperty("/startIndex", startIndex);
            oMaterialsModel.setProperty("/endIndex", endIndex);
            oMaterialsModel.setProperty("/canGoPrevious", currentPage > 1);
            oMaterialsModel.setProperty("/canGoNext", currentPage < totalPages);
        },

        _updateMaterialStatus: function(materialId, newStatus, approvedDate) {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var oRequestsModel = this.getOwnerComponent().getModel("requestsModel");
            
            // Update in materials model
            var aMaterials = oMaterialsModel.getProperty("/materials");
            var oMaterial = aMaterials.find(function(material) {
                return material.materialsID === materialId;
            });
            
            if (oMaterial) {
                oMaterial.status = newStatus;
                if (approvedDate) {
                    oMaterial.modifiedAt = approvedDate;
                    oMaterial.modifiedBy = "admin";
                }
                
                // Ensure vendor and plant names are mapped
                if (!oMaterial.vendorName && oMaterial.vendor_ID) {
                    oMaterial.vendorName = this._getVendorName(oMaterial.vendor_ID);
                }
                if (!oMaterial.plantName && oMaterial.plant_ID) {
                    oMaterial.plantName = this._getPlantName(oMaterial.plant_ID);
                }
                
                // Force model refresh
                oMaterialsModel.refresh(true);
            }
            
            // Update in requests model
            var aRequests = oRequestsModel.getProperty("/requests");
            var oRequest = aRequests.find(function(request) {
                return request.materialsID === materialId;
            });
            
            if (oRequest) {
                oRequest.status = newStatus;
                if (approvedDate) {
                    oRequest.modifiedAt = approvedDate;
                    oRequest.modifiedBy = "admin";
                }
                
                // Ensure vendor and plant names are mapped
                if (!oRequest.vendorName && oRequest.vendor_ID) {
                    oRequest.vendorName = this._getVendorName(oRequest.vendor_ID);
                }
                if (!oRequest.plantName && oRequest.plant_ID) {
                    oRequest.plantName = this._getPlantName(oRequest.plant_ID);
                }
                
                // Force model refresh
                oRequestsModel.refresh(true);
            }
            
            // Update counts and refresh requests list
            this._updateRequestCounts();
            
            // If status changed to approved, remove from requests list
            if (newStatus === "completedByIMA") {
                var aUpdatedRequests = aRequests.filter(function(request) {
                    return request.status !== "completedByIMA";
                });
                oRequestsModel.setProperty("/requests", aUpdatedRequests);
            }
            
            // Re-apply persona-based filtering to ensure proper display
            this._applyPersonaBasedFiltering();
        },

        _updateRequestCounts: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var oRequestsModel = this.getOwnerComponent().getModel("requestsModel");
            
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Calculate counts for materials model
            var approvedCount = aAllMaterials.filter(function(material) {
                return material.status === "completedByIMA";
            }).length;
            var requestedCount = aAllMaterials.filter(function(material) {
                return material.status === "pendingApproval";
            }).length;
            var emailSentCount = aAllMaterials.filter(function(material) {
                return material.status === "pendingIMA";
            }).length;
            
            oMaterialsModel.setProperty("/approvedCount", approvedCount);
            oMaterialsModel.setProperty("/requestedCount", requestedCount);
            oMaterialsModel.setProperty("/emailSentCount", emailSentCount);
            
            // Calculate counts for requests model
            var aRequests = aAllMaterials.filter(function(material) {
                return material.status === "pendingApproval" || material.status === "pendingIMA";
            });
            
            var pendingCount = aRequests.filter(function(request) {
                return request.status === "pendingApproval";
            }).length;
            var emailSentRequestCount = aRequests.filter(function(request) {
                return request.status === "pendingIMA";
            }).length;
            
            oRequestsModel.setProperty("/pendingCount", pendingCount);
            oRequestsModel.setProperty("/emailSentCount", emailSentRequestCount);
        },

        // Helper functions to get vendor and plant names from models
        _getVendorName: function(vendorId) {
            var oVendorsModel = this.getOwnerComponent().getModel("vendorsModel");
            var aVendors = oVendorsModel.getProperty("/vendors") || [];
            var oVendor = aVendors.find(function(vendor) {
                return vendor.vendor_ID === vendorId;
            });
            return oVendor ? oVendor.vendorName : vendorId;
        },

        _getPlantName: function(plantId) {
            var oPlantsModel = this.getOwnerComponent().getModel("plantsModel");
            var aPlants = oPlantsModel.getProperty("/plants") || [];
            var oPlant = aPlants.find(function(plant) {
                return plant.plant_ID === plantId;
            });
            return oPlant ? oPlant.plantName : plantId;
        },

        // Helper function to get filtered materials based on current user persona
        _getFilteredMaterialsForCurrentUser: function(aAllMaterials) {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            var sPersona = oUserModel.getProperty("/userPersona");
            
            if (sPersona === "MaterialSearchUser") {
                // MaterialSearchUser sees only completed materials
                return aAllMaterials.filter(function(material) {
                    return material.status === "completedByIMA";
                });
            } else if (sPersona === "MaterialCreateUser") {
                // MaterialCreateUser sees materials with status other than completed
                return aAllMaterials.filter(function(material) {
                    return material.status !== "completedByIMA";
                });
            } else if (sPersona === "AnalystUser") {
                // AnalystUser sees all materials
                return aAllMaterials;
            } else {
                // Default: show all materials
                return aAllMaterials;
            }
        },

        // Helper function to update pagination based on current user persona
        _updatePaginationForCurrentUser: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            var iPageSize = oMaterialsModel.getProperty("/pageSize");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            // Update pagination with filtered materials
            this._updatePagination(aFilteredMaterials, 1, iPageSize);
        },

        // Helper function to generate next request ID
        _generateNextRequestID: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            
            // Find the highest request ID
            var iMaxRequestID = 0;
            aAllMaterials.forEach(function(material) {
                if (material.requestID) {
                    var iCurrentID = parseInt(material.requestID);
                    if (iCurrentID > iMaxRequestID) {
                        iMaxRequestID = iCurrentID;
                    }
                }
            });
            
            // Generate next ID (6 characters, zero-padded)
            var iNextID = iMaxRequestID + 1;
            var sNextRequestID = iNextID.toString().padStart(6, '0');
            
            return sNextRequestID;
        },

        // Helper function to apply persona-based filtering when page is rendered
        _applyPersonaBasedFiltering: function() {
            var oMaterialsModel = this.getOwnerComponent().getModel("materialsModel");
            var aAllMaterials = oMaterialsModel.getProperty("/materials");
            var iPageSize = oMaterialsModel.getProperty("/pageSize");
            
            // Get filtered materials based on current user persona
            var aFilteredMaterials = this._getFilteredMaterialsForCurrentUser(aAllMaterials);
            
            // Update pagination with filtered materials
            this._updatePagination(aFilteredMaterials, 1, iPageSize);
            
            // For AnalystUser, also update filteredMaterials property for the analyst table
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            var sPersona = oUserModel.getProperty("/userPersona");
            
            if (sPersona === "AnalystUser") {
                oMaterialsModel.setProperty("/filteredMaterials", aFilteredMaterials);
            }
        },

        // Helper function to populate filter dropdowns for MaterialSearchUser
        _populateFilterDropdowns: function() {
            var oVendorFilter = this.byId("vendorFilter");
            var oPlantFilter = this.byId("plantFilter");
            
            if (oVendorFilter && oVendorFilter.getItems().length <= 1) {
                // Clear existing items except "All Vendors"
                oVendorFilter.removeAllItems();
                oVendorFilter.addItem(new sap.ui.core.Item({
                    key: "",
                    text: "All Vendors"
                }));
                
                // Add vendor options
                var aVendors = [
                    "Caterpillar Inc.",
                    "Komatsu Ltd.", 
                    "Volvo Construction Equipment",
                    "John Deere Construction",
                    "Liebherr Group",
                    "Hitachi Construction Machinery"
                ];
                
                aVendors.forEach(function(sVendor) {
                    oVendorFilter.addItem(new sap.ui.core.Item({
                        key: sVendor,
                        text: sVendor
                    }));
                });
            }
            
            if (oPlantFilter && oPlantFilter.getItems().length <= 1) {
                // Clear existing items except "All Plants"
                oPlantFilter.removeAllItems();
                oPlantFilter.addItem(new sap.ui.core.Item({
                    key: "",
                    text: "All Plants"
                }));
                
                // Add plant options
                var aPlants = [
                    "Houston Manufacturing Plant",
                    "Chicago Steel Works",
                    "Phoenix Concrete Facility",
                    "Atlanta Materials Hub",
                    "Denver Construction Center",
                    "Seattle Industrial Complex"
                ];
                
                aPlants.forEach(function(sPlant) {
                    oPlantFilter.addItem(new sap.ui.core.Item({
                        key: sPlant,
                        text: sPlant
                    }));
                });
            }
        }
    });
});
