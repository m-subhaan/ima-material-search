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
            var oMaterialRequestsModel = this._createMaterialRequestsModel();
            var oDeviceModel = this._createDeviceModel();
            
            this.setModel(oODataModel, "odataModel");
            this.setModel(oUserModel, "userModel");
            this.setModel(oMaterialRequestsModel, "materialRequestsModel");
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
            
            // Load MaterialRequests data
            fetch("http://localhost:4004/odata/v4/catalog/MaterialRequests")
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                var materialRequestsData = result.value;
                
                console.log("MaterialRequests loaded from OData:", materialRequestsData.length);
                
                // Process material requests data
                that._processMaterialRequestsData(materialRequestsData);
            })
            .catch(function(error) {
                console.error("Failed to load MaterialRequests data:", error);
            });
        },

        _processMaterialRequestsData: function(aMaterialRequests) {
            var oMaterialRequestsModel = this.getModel("materialRequestsModel");
                    
            // Filter approved materials for MaterialSearchUser
            var aApprovedMaterials = aMaterialRequests.filter(function(material) {
                return material.status === "approved";
            });
                    
            // Set material requests data
            oMaterialRequestsModel.setProperty("/materialRequests", aMaterialRequests);
            oMaterialRequestsModel.setProperty("/filteredMaterials", aApprovedMaterials);
            oMaterialRequestsModel.setProperty("/totalItems", aApprovedMaterials.length);
                    
            // Initialize pagination for approved materials
            this._updatePagination(aApprovedMaterials, 1, 10);
            
            // Calculate and set counts
            var approvedCount = aMaterialRequests.filter(function(material) {
                return material.status === "approved";
            }).length;
            var requestedCount = aMaterialRequests.filter(function(material) {
                return material.status === "requested";
            }).length;
            var emailSentCount = aMaterialRequests.filter(function(material) {
                return material.status === "emailSentToIMA";
            }).length;
                    
            oMaterialRequestsModel.setProperty("/approvedCount", approvedCount);
            oMaterialRequestsModel.setProperty("/requestedCount", requestedCount);
            oMaterialRequestsModel.setProperty("/emailSentCount", emailSentCount);
        },

        // Model creation methods
        _createUserModel: function() {
            return new JSONModel({
                isAuthenticated: false,
                currentUser: null,
                userPersona: null
            });
        },

        _createMaterialRequestsModel: function() {
            return new JSONModel({
                materialRequests: [],
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

        _createDeviceModel: function() {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        _updatePagination: function(aMaterials, currentPage, pageSize) {
            var oMaterialRequestsModel = this.getModel("materialRequestsModel");
            var totalItems = aMaterials.length;
            var totalPages = Math.ceil(totalItems / pageSize);
            var startIndex = (currentPage - 1) * pageSize;
            var endIndex = Math.min(startIndex + pageSize, totalItems);
            
            var aPaginatedMaterials = aMaterials.slice(startIndex, endIndex);
            
            oMaterialRequestsModel.setProperty("/filteredMaterials", aPaginatedMaterials);
            oMaterialRequestsModel.setProperty("/currentPage", currentPage);
            oMaterialRequestsModel.setProperty("/totalPages", totalPages);
            oMaterialRequestsModel.setProperty("/pageSize", pageSize);
            oMaterialRequestsModel.setProperty("/startIndex", startIndex + 1);
            oMaterialRequestsModel.setProperty("/endIndex", endIndex);
            oMaterialRequestsModel.setProperty("/canGoPrevious", currentPage > 1);
            oMaterialRequestsModel.setProperty("/canGoNext", currentPage < totalPages);
        }
		});
});
