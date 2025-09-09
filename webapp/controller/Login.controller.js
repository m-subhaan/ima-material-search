sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("openui5.hello.world.controller.Login", {
        onInit: function () {
            // Initialize login model
            var oLoginModel = new JSONModel({
                username: "",
                password: ""
            });
            this.getView().setModel(oLoginModel);
            
            // Initialize users configuration
            this._users = [
                {
                    "username": "materialsearch",
                    "password": "admin123",
                    "persona": "MaterialSearchUser",
                    "displayName": "Material Search User"
                },
                {
                    "username": "materialapprover",
                    "password": "admin123",
                    "persona": "MaterialApproverUser",
                    "displayName": "Material Approver User"
                },
                {
                    "username": "analyst",
                    "password": "admin123",
                    "persona": "AnalystUser",
                    "displayName": "Analyst User"
                }
            ];
            console.log("Users initialized:", this._users);
        },

        onLoginPress: function () {
            var oLoginModel = this.getView().getModel();
            var sUsername = oLoginModel.getProperty("/username");
            var sPassword = oLoginModel.getProperty("/password");
            
            if (!sUsername || !sPassword) {
                this._showError("Please enter both username and password");
                return;
            }
            
            if (!this._users || !Array.isArray(this._users) || this._users.length === 0) {
                this._showError("User configuration not available. Please refresh the page and try again.");
                console.log("Users status:", this._users);
                return;
            }
            
            // Authenticate against users configuration
            var oUser = this._users.find(function(user) {
                return user.username === sUsername && user.password === sPassword;
            });
            
            if (oUser) {
                // Update global user model
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                oUserModel.setProperty("/isAuthenticated", true);
                oUserModel.setProperty("/currentUser", oUser);
                oUserModel.setProperty("/userPersona", oUser.persona);
                
                MessageToast.show("Login successful! Welcome " + oUser.displayName);
                this._navigateToMain();
            } else {
                this._showError("Invalid username or password");
            }
        },

        _navigateToMain: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("main");
        },

        _showError: function (sMessage) {
            var oErrorMessage = this.byId("errorMessage");
            oErrorMessage.setText(sMessage);
            oErrorMessage.setVisible(true);
            
            // Hide error after 5 seconds
            setTimeout(function () {
                oErrorMessage.setVisible(false);
            }, 5000);
        }
    });
});
