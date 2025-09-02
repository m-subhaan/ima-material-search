sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/odata/v4/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function(UIComponent, ODataModel, JSONModel, Device) {
    "use strict";

    return UIComponent.extend("openui5.hello.world.Component", {
			metadata: {
				manifest: "json"
			},

        init: function() {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
            
            // Initialize models
            this._initializeModels();
            
            // Initialize the router
				var oRouter = this.getRouter();
				oRouter.initialize();
			},

        _initializeModels: function() {
            // Create OData model for CAP service
            var oODataModel = new ODataModel({
                serviceUrl: "http://localhost:4004/odata/v4/catalog/",
                autoExpandSelect: true,
                operationMode: "Server"
            });
            
            // Create and set models
            var oUserModel = this._createUserModel();
            var oMaterialsModel = this._createMaterialsModel();
            var oRequestsModel = this._createRequestsModel();
            var oVendorsModel = this._createVendorsModel();
            var oPlantsModel = this._createPlantsModel();
            var oDeviceModel = this._createDeviceModel();
            
            this.setModel(oODataModel, "odataModel");
            this.setModel(oUserModel, "userModel");
            this.setModel(oMaterialsModel, "materialsModel");
            this.setModel(oRequestsModel, "requestsModel");
            this.setModel(oVendorsModel, "vendorsModel");
            this.setModel(oPlantsModel, "plantsModel");
            this.setModel(oDeviceModel, "device");
            
            // Load initial data from OData
            this._loadInitialData();
        },

        _loadInitialData: function() {
            var that = this;
            var oODataModel = this.getModel("odataModel");
            
            // Load data from OData service using fetch API as fallback
            this._loadDataWithFetch();
        },

        _loadDataWithFetch: function() {
            var that = this;
            
            // Load all data in parallel and then process together
            Promise.all([
                fetch("http://localhost:4004/odata/v4/catalog/Materials").then(response => response.json()),
                fetch("http://localhost:4004/odata/v4/catalog/Vendors").then(response => response.json()),
                fetch("http://localhost:4004/odata/v4/catalog/Plants").then(response => response.json())
            ])
            .then(function(results) {
                var materialsData = results[0].value;
                var vendorsData = results[1].value;
                var plantsData = results[2].value;
                
                console.log("Materials loaded from OData:", materialsData.length);
                console.log("Vendors loaded from OData:", vendorsData.length);
                console.log("Plants loaded from OData:", plantsData.length);
                
                // Process vendors and plants first
                that._processVendorsData(vendorsData);
                that._processPlantsData(plantsData);
                
                // Then process materials with vendor/plant mapping
                that._processMaterialsData(materialsData);
                
                // Populate dropdowns after a short delay to ensure UI is ready
                setTimeout(function() {
                    // Try to populate dropdowns from component level
                    that._populateVendorDropdowns(vendorsData);
                    that._populatePlantDropdowns(plantsData);
                    
                    // Also trigger dropdown population from controller if view is ready
                    var oMainView = that.getRootControl();
                    if (oMainView && oMainView.getController()) {
                        var oController = oMainView.getController();
                        if (oController._populateDropdownsFromModels) {
                            oController._populateDropdownsFromModels();
                        }
                    }
                }, 500);
            })
            .catch(function(error) {
                console.error("Failed to load data:", error);
            });
        },

        _processMaterialsData: function(aMaterials) {
            var oMaterialsModel = this.getModel("materialsModel");
            var oRequestsModel = this.getModel("requestsModel");
                    
                    // Map vendor and plant names to materials for display
            this._mapVendorAndPlantNames(aMaterials);
                    
            // Set materials
            oMaterialsModel.setProperty("/materials", aMaterials);
                    oMaterialsModel.setProperty("/filteredMaterials", aMaterials);
                    oMaterialsModel.setProperty("/totalItems", aMaterials.length);
                    oMaterialsModel.setProperty("/showMaterialRequestForm", true);
                    
            // Initialize pagination
            this._updatePagination(aMaterials, 1, 10);
            
            // Calculate and set counts
                    var approvedCount = aMaterials.filter(function(material) {
                        return material.status === "approved";
                    }).length;
                    var requestedCount = aMaterials.filter(function(material) {
                        return material.status === "requested";
                    }).length;
                    var emailSentCount = aMaterials.filter(function(material) {
                        return material.status === "emailSentToIMA";
                    }).length;
                    
                    oMaterialsModel.setProperty("/approvedCount", approvedCount);
                    oMaterialsModel.setProperty("/requestedCount", requestedCount);
                    oMaterialsModel.setProperty("/emailSentCount", emailSentCount);
                    
            // Set requests
                    var aRequests = aMaterials.filter(function(material) {
                        return material.status === "requested" || material.status === "emailSentToIMA";
                    });
                    oRequestsModel.setProperty("/requests", aRequests);
                    
                    var pendingCount = aRequests.filter(function(request) {
                        return request.status === "requested";
                    }).length;
                    var emailSentRequestCount = aRequests.filter(function(request) {
                        return request.status === "emailSentToIMA";
                    }).length;
                    
                    oRequestsModel.setProperty("/pendingCount", pendingCount);
                    oRequestsModel.setProperty("/emailSentCount", emailSentRequestCount);
        },

        _processVendorsData: function(aVendors) {
            var oVendorsModel = this.getModel("vendorsModel");
            oVendorsModel.setProperty("/vendors", aVendors);
        },

        _processPlantsData: function(aPlants) {
            var oPlantsModel = this.getModel("plantsModel");
            oPlantsModel.setProperty("/plants", aPlants);
        },

        _populateVendorDropdowns: function(aVendors) {
            var that = this;
            var attemptCount = 0;
            var maxAttempts = 20;
            
            function tryPopulate() {
                // Try to get the main view first
                var oMainView = that.getRootControl();
                if (!oMainView) {
                    if (attemptCount < maxAttempts) {
                        attemptCount++;
                        setTimeout(tryPopulate, 300);
                    } else {
                        console.warn("Failed to get main view after", maxAttempts, "attempts");
                    }
                    return;
                }
                
                // Since the fragment is embedded directly, we can access controls directly from the main view
                var oVendorFilter = oMainView.byId("vendorFilter");
                var oMaterialVendor = oMainView.byId("materialVendor");
                
                if (oVendorFilter && oMaterialVendor) {
                    console.log("Populating vendor dropdowns with", aVendors.length, "vendors");
                    
                    // Populate filter dropdown
                    oVendorFilter.destroyItems();
                    oVendorFilter.addItem(new sap.ui.core.Item({key: "", text: "All Vendors"}));
                    aVendors.forEach(function(vendor) {
                        oVendorFilter.addItem(new sap.ui.core.Item({
                            key: vendor.vendor_ID, 
                            text: vendor.vendorName
                        }));
                    });
                    
                    // Populate create form dropdown
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
                } else {
                    console.log("Vendor dropdowns not found, attempt", attemptCount + 1);
                    if (attemptCount < maxAttempts) {
                        attemptCount++;
                        setTimeout(tryPopulate, 300);
                    } else {
                        console.warn("Failed to populate vendor dropdowns after", maxAttempts, "attempts");
                    }
                }
            }
            
            tryPopulate();
        },

        _populatePlantDropdowns: function(aPlants) {
            var that = this;
            var attemptCount = 0;
            var maxAttempts = 20;
            
            function tryPopulate() {
                // Try to get the main view first
                var oMainView = that.getRootControl();
                if (!oMainView) {
                    if (attemptCount < maxAttempts) {
                        attemptCount++;
                        setTimeout(tryPopulate, 300);
                    } else {
                        console.warn("Failed to get main view after", maxAttempts, "attempts");
                    }
                    return;
                }
                
                // Since the fragment is embedded directly, we can access controls directly from the main view
                var oPlantFilter = oMainView.byId("plantFilter");
                var oMaterialPlant = oMainView.byId("materialPlant");
                
                if (oPlantFilter && oMaterialPlant) {
                    console.log("Populating plant dropdowns with", aPlants.length, "plants");
                    
                    // Populate filter dropdown
                    oPlantFilter.destroyItems();
                    oPlantFilter.addItem(new sap.ui.core.Item({key: "", text: "All Plants"}));
                    aPlants.forEach(function(plant) {
                        oPlantFilter.addItem(new sap.ui.core.Item({
                            key: plant.plant_ID, 
                            text: plant.plantName
                        }));
                    });
                    
                    // Populate create form dropdown
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
                } else {
                    console.log("Plant dropdowns not found, attempt", attemptCount + 1);
                    if (attemptCount < maxAttempts) {
                        attemptCount++;
                        setTimeout(tryPopulate, 300);
                    } else {
                        console.warn("Failed to populate plant dropdowns after", maxAttempts, "attempts");
                    }
                }
            }
            
            tryPopulate();
        },

        // Model creation methods
        _createUserModel: function() {
            return new JSONModel({
                isAuthenticated: false,
                currentUser: null,
                userPersona: null
            });
        },

        _createMaterialsModel: function() {
            return new JSONModel({
                materials: [],
                filteredMaterials: [],
                approvedCount: 0,
                requestedCount: 0,
                emailSentCount: 0,
                currentPage: 1,
                pageSize: 10,
                totalPages: 1,
                totalItems: 0,
                startIndex: 1,
                endIndex: 0,
                canGoPrevious: false,
                canGoNext: false
            });
        },

        _createRequestsModel: function() {
            return new JSONModel({
                requests: [],
                pendingCount: 0,
                emailSentCount: 0
            });
        },

        _createVendorsModel: function() {
            return new JSONModel({
                vendors: []
            });
        },

        _createPlantsModel: function() {
            return new JSONModel({
                plants: []
            });
        },

        _createDeviceModel: function() {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        _updatePagination: function(aMaterials, currentPage, pageSize) {
            var oMaterialsModel = this.getModel("materialsModel");
            var totalItems = aMaterials.length;
            var totalPages = Math.ceil(totalItems / pageSize);
            var startIndex = (currentPage - 1) * pageSize;
            var endIndex = Math.min(startIndex + pageSize, totalItems);
            
            var aPaginatedMaterials = aMaterials.slice(startIndex, endIndex);
            
            oMaterialsModel.setProperty("/filteredMaterials", aPaginatedMaterials);
            oMaterialsModel.setProperty("/currentPage", currentPage);
            oMaterialsModel.setProperty("/totalPages", totalPages);
            oMaterialsModel.setProperty("/pageSize", pageSize);
            oMaterialsModel.setProperty("/startIndex", startIndex + 1);
            oMaterialsModel.setProperty("/endIndex", endIndex);
            oMaterialsModel.setProperty("/canGoPrevious", currentPage > 1);
            oMaterialsModel.setProperty("/canGoNext", currentPage < totalPages);
        },

        _mapVendorAndPlantNames: function(aMaterials) {
            if (!aMaterials) {
                return;
            }
            
            var oVendorsModel = this.getModel("vendorsModel");
            var oPlantsModel = this.getModel("plantsModel");
            var aVendors = oVendorsModel.getProperty("/vendors") || [];
            var aPlants = oPlantsModel.getProperty("/plants") || [];
            
            // Create lookup maps for vendors and plants
            var oVendorMap = {};
            var oPlantMap = {};
            
            aVendors.forEach(function(vendor) {
                oVendorMap[vendor.vendor_ID] = vendor.vendorName;
            });
            
            aPlants.forEach(function(plant) {
                oPlantMap[plant.plant_ID] = plant.plantName;
            });
            
            // Map names to materials
            aMaterials.forEach(function(material) {
                material.vendorName = oVendorMap[material.vendor_ID] || material.vendor_ID;
                material.plantName = oPlantMap[material.plant_ID] || material.plant_ID;
            });
        },

        _getAllMaterials: function() {
            // Get all materials from the original data source
            var oMaterialsModel = this.getModel("materialsModel");
            var aMaterials = oMaterialsModel.getProperty("/materials");
            
            // If no materials in current model, try to get from original source
            if (!aMaterials || aMaterials.length === 0) {
                // This is a fallback - in a real app, you'd maintain the original data separately
                return [];
            }
            
            return aMaterials;
			}
		});
});
